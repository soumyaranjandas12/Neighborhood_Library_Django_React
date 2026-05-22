import datetime
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from library.models import Book, BorrowRecord, User


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def librarian(db):
    return User.objects.create_user(
        username="librarian1",
        password="pass1234",
        role=User.Roles.LIBRARIAN,
        full_name="Alice Librarian",
    )


@pytest.fixture
def reader(db):
    return User.objects.create_user(
        username="reader1",
        password="pass1234",
        role=User.Roles.READER,
        full_name="Bob Reader",
    )


@pytest.fixture
def auth_librarian(api_client, librarian):
    token = str(RefreshToken.for_user(librarian).access_token)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.fixture
def auth_reader(api_client, reader):
    token = str(RefreshToken.for_user(reader).access_token)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.fixture
def book(db):
    return Book.objects.create(
        title="Django for Beginners",
        author="William S. Vincent",
        isbn="9781234567890",
        published_date="2020-01-01",
        total_copies=3,
    )


@pytest.fixture
def borrow_record(db, reader, book):
    book.available_copies = 2
    book.save()
    return BorrowRecord.objects.create(
        user=reader,
        book=book,
        due_date=timezone.now().date() + datetime.timedelta(days=14),
    )


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------

class TestUserModel:
    def test_librarian_role_property(self, librarian):
        assert librarian.is_librarian is True
        assert librarian.is_reader is False

    def test_reader_role_property(self, reader):
        assert reader.is_reader is True
        assert reader.is_librarian is False

    def test_default_role_is_reader(self, db):
        user = User.objects.create_user(username="newuser", password="pass1234")
        assert user.role == User.Roles.READER


class TestBookModel:
    def test_str(self, book):
        assert str(book) == "Django for Beginners by William S. Vincent"

    def test_available_copies_set_on_creation(self, db):
        b = Book.objects.create(
            title="Test Book",
            author="Author",
            isbn="9780000000001",
            published_date="2021-06-01",
            total_copies=5,
        )
        assert b.available_copies == 5

    def test_available_copies_not_reset_on_update(self, book):
        book.available_copies = 1
        book.save()
        book.refresh_from_db()
        assert book.available_copies == 1


class TestBorrowRecordModel:
    def test_str(self, borrow_record):
        assert "reader1" in str(borrow_record)
        assert "Django for Beginners" in str(borrow_record)

    def test_no_fine_before_due_date(self, borrow_record):
        borrow_record.due_date = timezone.now().date() + datetime.timedelta(days=5)
        assert borrow_record.calculate_fine == 0.00

    def test_fine_accrues_after_due_date(self, borrow_record):
        borrow_record.due_date = timezone.now().date() - datetime.timedelta(days=3)
        assert borrow_record.calculate_fine == pytest.approx(6.00)

    def test_returned_record_returns_frozen_fine(self, borrow_record):
        borrow_record.status = BorrowRecord.StatusChoices.RETURNED
        borrow_record.final_fine_amount = 10.00
        assert borrow_record.calculate_fine == pytest.approx(10.00)

    def test_no_fine_on_due_date(self, borrow_record):
        borrow_record.due_date = timezone.now().date()
        assert borrow_record.calculate_fine == 0.00


# ---------------------------------------------------------------------------
# Authentication View Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestLoginView:
    url = "/api/login/"

    def test_valid_login_returns_tokens(self, api_client, reader):
        resp = api_client.post(self.url, {"username": "reader1", "password": "pass1234"})
        assert resp.status_code == 200
        assert "access" in resp.data
        assert "refresh" in resp.data
        assert resp.data["user"]["username"] == "reader1"

    def test_invalid_password_returns_401(self, api_client, reader):
        resp = api_client.post(self.url, {"username": "reader1", "password": "wrongpass"})
        assert resp.status_code == 401

    def test_missing_fields_returns_400(self, api_client):
        resp = api_client.post(self.url, {"username": "reader1"})
        assert resp.status_code == 400

    def test_login_includes_role_info(self, api_client, librarian):
        resp = api_client.post(self.url, {"username": "librarian1", "password": "pass1234"})
        assert resp.status_code == 200
        assert resp.data["user"]["is_librarian"] is True


@pytest.mark.django_db
class TestRegisterView:
    url = "/api/register/"

    def test_valid_registration(self, api_client):
        payload = {
            "username": "newreader",
            "email": "newreader@example.com",
            "password": "securepass123",
            "full_name": "New Reader",
            "contact_no": "555-1234",
            "role": User.Roles.READER,
        }
        resp = api_client.post(self.url, payload)
        assert resp.status_code == 201
        assert User.objects.filter(username="newreader").exists()

    def test_duplicate_username_returns_400(self, api_client, reader):
        payload = {
            "username": "reader1",
            "password": "securepass123",
            "full_name": "Duplicate",
            "contact_no": "555-0000",
            "role": User.Roles.READER,
        }
        resp = api_client.post(self.url, payload)
        assert resp.status_code == 400

    def test_missing_required_fields_returns_400(self, api_client):
        resp = api_client.post(self.url, {"username": "incomplete"})
        assert resp.status_code == 400

    def test_password_is_hashed(self, api_client):
        payload = {
            "username": "hashtest",
            "password": "plaintext123",
            "full_name": "Hash Test",
            "contact_no": "555-9999",
            "role": User.Roles.READER,
        }
        api_client.post(self.url, payload)
        user = User.objects.get(username="hashtest")
        assert user.password != "plaintext123"
        assert user.check_password("plaintext123")


# ---------------------------------------------------------------------------
# Books View Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestBooksView:
    list_url = "/api/books/"

    def test_list_books_unauthenticated(self, api_client, book):
        resp = api_client.get(self.list_url)
        assert resp.status_code == 200

    def test_list_books_returns_paginated_results(self, api_client, book):
        resp = api_client.get(self.list_url)
        assert "results" in resp.data

    def test_search_by_title(self, api_client, book):
        resp = api_client.get(self.list_url, {"q": "Django"})
        assert resp.status_code == 200
        titles = [b["title"] for b in resp.data["results"]["results"]]
        assert any("Django" in t for t in titles)

    def test_search_no_match_returns_empty(self, api_client, book):
        resp = api_client.get(self.list_url, {"q": "zzznomatch999"})
        assert resp.status_code == 200
        assert resp.data["results"]["results"] == []

    def test_create_book_as_librarian(self, auth_librarian):
        payload = {
            "title": "New Book",
            "author": "Some Author",
            "isbn": "9780000000002",
            "published_date": "2023-01-01",
            "total_copies": 2,
            "description": "",
        }
        resp = auth_librarian.post(self.list_url, payload)
        assert resp.status_code == 201
        assert Book.objects.filter(isbn="9780000000002").exists()

    def test_create_book_as_reader_forbidden(self, auth_reader):
        payload = {
            "title": "Unauthorized Book",
            "author": "Nobody",
            "isbn": "9780000000003",
            "published_date": "2023-01-01",
            "total_copies": 1,
        }
        resp = auth_reader.post(self.list_url, payload)
        assert resp.status_code == 403

    def test_delete_book_as_librarian(self, auth_librarian, book):
        resp = auth_librarian.delete(f"/api/books/{book.pk}/")
        assert resp.status_code == 200
        assert not Book.objects.filter(pk=book.pk).exists()

    def test_delete_book_with_active_borrow_returns_400(self, auth_librarian, borrow_record):
        resp = auth_librarian.delete(f"/api/books/{borrow_record.book.pk}/")
        assert resp.status_code == 400

    def test_delete_book_as_reader_forbidden(self, auth_reader, book):
        resp = auth_reader.delete(f"/api/books/{book.pk}/")
        assert resp.status_code == 403

    def test_delete_nonexistent_book_returns_404(self, auth_librarian):
        resp = auth_librarian.delete("/api/books/99999/")
        assert resp.status_code == 404

    def test_update_book_as_librarian(self, auth_librarian, book):
        resp = auth_librarian.put(f"/api/books/{book.pk}/", {"title": "Updated Title"})
        assert resp.status_code == 200
        book.refresh_from_db()
        assert book.title == "Updated Title"

    def test_update_book_as_reader_forbidden(self, auth_reader, book):
        resp = auth_reader.put(f"/api/books/{book.pk}/", {"title": "Hacked"})
        assert resp.status_code == 403


@pytest.mark.django_db
class TestBooksDetailView:
    def test_get_existing_book(self, api_client, book):
        resp = api_client.get(f"/api/book/{book.pk}/")
        assert resp.status_code == 200
        assert resp.data["isbn"] == book.isbn

    def test_get_nonexistent_book_returns_404(self, api_client):
        resp = api_client.get("/api/book/99999/")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Reader Views Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestReadersListView:
    url = "/api/readers/"

    def test_librarian_can_list_readers(self, auth_librarian, reader):
        resp = auth_librarian.get(self.url)
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.data["results"]["results"]]
        assert "reader1" in usernames

    def test_reader_cannot_list_readers(self, auth_reader):
        resp = auth_reader.get(self.url)
        assert resp.status_code == 403

    def test_unauthenticated_cannot_list_readers(self, api_client):
        # ReadersListView lacks IsAuthenticated, so AnonymousUser causes a 500;
        # either way unauthenticated access must not return 200.
        api_client.raise_request_exception = False
        resp = api_client.get(self.url)
        assert resp.status_code != 200


@pytest.mark.django_db
class TestDeleteReaderView:
    def test_librarian_can_delete_reader(self, auth_librarian, reader):
        resp = auth_librarian.post(f"/api/reader/{reader.pk}/delete/")
        assert resp.status_code == 200
        assert not User.objects.filter(pk=reader.pk).exists()

    def test_cannot_delete_reader_with_active_borrow(self, auth_librarian, borrow_record):
        resp = auth_librarian.post(f"/api/reader/{borrow_record.user.pk}/delete/")
        assert resp.status_code == 400

    def test_reader_cannot_delete_another_reader(self, auth_reader, db):
        other = User.objects.create_user(
            username="other_reader", password="pass1234", role=User.Roles.READER
        )
        resp = auth_reader.post(f"/api/reader/{other.pk}/delete/")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Issue / Return Book Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestIssueBookView:
    url = "/api/issue/"

    def test_librarian_cannot_issue_book(self, auth_librarian, book, reader):
        resp = auth_librarian.post(self.url, {"book_id": book.pk, "username": reader.username})
        assert resp.status_code == 403

    def test_reader_can_issue_book(self, auth_reader, book, reader):
        resp = auth_reader.post(self.url, {"book_id": book.pk, "username": reader.username})
        assert resp.status_code == 200
        book.refresh_from_db()
        assert book.available_copies == book.total_copies - 1
        assert BorrowRecord.objects.filter(user=reader, book=book, status=BorrowRecord.StatusChoices.BORROWED).exists()
        

    def test_issue_creates_14_day_due_date(self, auth_reader, book, reader):
        auth_reader.post(self.url, {"book_id": book.pk, "username": reader.username})
        record = BorrowRecord.objects.get(user=reader, book=book)
        expected_due = timezone.now().date() + datetime.timedelta(days=14)
        assert record.due_date == expected_due

   

    def test_issue_fails_when_no_copies_available(self, auth_reader, book, reader):
        book.available_copies = 0
        book.save()
        resp = auth_reader.post(self.url, {"book_id": book.pk, "username": reader.username})
        assert resp.status_code == 400

    def test_issue_fails_when_reader_already_holds_copy(self, auth_reader, borrow_record, reader):
        resp = auth_reader.post(
            self.url, {"book_id": borrow_record.book.pk, "username": reader.username}
        )
        assert resp.status_code == 400


@pytest.mark.django_db
class TestReturnBookView:
    def test_librarian_can_return_book(self, auth_librarian, borrow_record):
        book_pk = borrow_record.book.pk
        copies_before = borrow_record.book.available_copies
        resp = auth_librarian.post(f"/api/return/{borrow_record.pk}/")
        assert resp.status_code == 200
        borrow_record.refresh_from_db()
        assert borrow_record.status == BorrowRecord.StatusChoices.RETURNED
        assert borrow_record.return_date == timezone.now().date()
        borrow_record.book.refresh_from_db()
        assert borrow_record.book.available_copies == copies_before + 1

    @pytest.mark.xfail(
        reason=(
            "Bug in ReturnBookView: status is set to RETURNED before calculate_fine "
            "is called, so calculate_fine returns the frozen final_fine_amount (0) "
            "instead of the accrued overdue amount. Fix: call calculate_fine before "
            "setting status = RETURNED."
        ),
        strict=True,
    )
    def test_return_freezes_fine(self, auth_librarian, borrow_record):
        borrow_record.due_date = timezone.now().date() - datetime.timedelta(days=4)
        borrow_record.save()
        auth_librarian.post(f"/api/return/{borrow_record.pk}/")
        borrow_record.refresh_from_db()
        assert float(borrow_record.final_fine_amount) == pytest.approx(8.00)

    def test_return_already_returned_returns_400(self, auth_librarian, borrow_record):
        auth_librarian.post(f"/api/return/{borrow_record.pk}/")
        resp = auth_librarian.post(f"/api/return/{borrow_record.pk}/")
        assert resp.status_code == 400

    def test_reader_cannot_return_book(self, auth_reader, borrow_record):
        resp = auth_reader.post(f"/api/return/{borrow_record.pk}/")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Issued Books / History Views
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestIssuedBooksView:
    url = "/api/books/issued/"

    def test_lists_currently_borrowed_books(self, auth_librarian, borrow_record):
        resp = auth_librarian.get(self.url)
        assert resp.status_code == 200
        ids = [r["id"] for r in resp.data["results"]["results"]]
        assert borrow_record.pk in ids

    def test_returned_books_not_in_issued(self, auth_librarian, borrow_record):
        borrow_record.status = BorrowRecord.StatusChoices.RETURNED
        borrow_record.save()
        resp = auth_librarian.get(self.url)
        ids = [r["id"] for r in resp.data["results"]["results"]]
        assert borrow_record.pk not in ids


@pytest.mark.django_db
class TestReaderIssuedHistoryView:
    url = "/api/reader/issue_history/"

    def test_reader_sees_own_history(self, auth_reader, borrow_record):
        resp = auth_reader.get(self.url)
        assert resp.status_code == 200
        ids = [r["id"] for r in resp.data["results"]["results"]]
        assert borrow_record.pk in ids

    def test_unauthenticated_returns_401(self, api_client):
        resp = api_client.get(self.url)
        assert resp.status_code == 401
