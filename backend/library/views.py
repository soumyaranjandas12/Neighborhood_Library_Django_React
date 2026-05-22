import datetime
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.db.models import Q
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Book, BorrowRecord, User
from rest_framework.pagination import PageNumberPagination
from .serializers import BookSerializer, CustomLoginSerializer, CustomUserSerializer, \
    BorrowRecordSerializer, RegisterSerializer


class Pagination(PageNumberPagination):
    page_size = 10


# Create your views here.
class CustomLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = CustomLoginSerializer(data=request.data)

        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            # ✅ Proper authentication
            user = authenticate(username=username, password=password)

            if user is None:
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # ✅ Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            user_data = {
                "username": user.username,
                "role": user.role,
                "is_librarian": user.is_librarian,
                "is_reader": user.is_reader,
                "full_name": user.full_name,
            }

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": user_data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.create(serializer.validated_data)
            return Response('User registered successfully.', status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomLogoutView(APIView):
    def post(self, request):
        return redirect('react-login')


class BooksView(APIView):

    def get(self, request):
        books = Book.objects.all()
        query = self.request.GET.get('q')
        if query:
            books = books.filter(Q(title__icontains=query) | Q(author__icontains=query) | Q(isbn__icontains=query))
        paginator = Pagination()
        page = paginator.paginate_queryset(books, request)
        serializer = BookSerializer(page, many=True)
        total_issued = BorrowRecord.objects.filter(status=BorrowRecord.StatusChoices.BORROWED).count()
        return paginator.get_paginated_response({
            "results": serializer.data,
            "total_issued": total_issued
        })

    def post(self, request):
        if not request.user.is_librarian:
            return Response(
                {"error": "Only librarians can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = BookSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not request.user.is_librarian:
            return Response(
                {"error": "Only librarians can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            book = Book.objects.get(id=pk)
            borrowed = BorrowRecord.objects.filter(book=book, status=BorrowRecord.StatusChoices.BORROWED)
            if borrowed.exists():
                return Response(
                    {"error": "Book cannot be deleted as it is currently borrowed."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            book.delete()
            return Response(f"Book '{book.title}' deleted successfully.", status=status.HTTP_200_OK)
        except Book.DoesNotExist:
            return Response(
                {"error": "Book not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    def put(self, request, pk):
        if not request.user.is_librarian:
            return Response(
                {"error": "Only librarians can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        book = get_object_or_404(Book, id=pk)
        serializer = BookSerializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BooksDetailView(APIView):
    def get(self, request, pk):
        try:
            book = Book.objects.get(id=pk)
            serializer = BookSerializer(book)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Book.DoesNotExist:
            return Response(
                {"error": "Book not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class ReadersListView(APIView):
    def get(self, request):
        if not request.user.is_librarian:
            return Response(
                {"error": "Only librarians can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        readers = User.objects.all()
        readers = readers.filter(role=User.Roles.READER)
        paginator = Pagination()
        page = paginator.paginate_queryset(readers, request)
        serializer = CustomUserSerializer(page, many=True)
        return paginator.get_paginated_response({
            "results": serializer.data
        })


class AllReadersListView(APIView):
    def get(self, request):
        if not request.user.is_librarian:
            return Response(
                {"error": "Only librarians can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        readers = User.objects.all()
        readers = readers.filter(role=User.Roles.READER)
        serializer = CustomUserSerializer(readers, many=True)
        return Response({
            "results": serializer.data
        }, status=status.HTTP_200_OK)


class IssuedBooksView(APIView):
    def get(self, request):
        issued_books = BorrowRecord.objects.filter(status=BorrowRecord.StatusChoices.BORROWED)
        paginator = Pagination()
        page = paginator.paginate_queryset(issued_books, request)
        serializer = BorrowRecordSerializer(page, many=True)
        return paginator.get_paginated_response({
            "results": serializer.data
        })


class IssuedHistoryView(APIView):
    def get(self, request):
        issued_history = BorrowRecord.objects.select_related('book', 'user').all()
        paginator = Pagination()
        page = paginator.paginate_queryset(issued_history, request)
        serializer = BorrowRecordSerializer(page, many=True)
        return paginator.get_paginated_response({
            "results": serializer.data
        })

class ReaderIssuedHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print(request.user)
        reader = get_object_or_404(User, username=request.user.username, role=User.Roles.READER)
        issued_history = BorrowRecord.objects.select_related('book', 'user').filter(user=reader)
        paginator = Pagination()
        page = paginator.paginate_queryset(issued_history, request)
        serializer = BorrowRecordSerializer(page, many=True)
        return paginator.get_paginated_response({
            "results": serializer.data
        })


class DeleteReaderView(APIView):
    permission_classes = [IsAuthenticated]
    """Allows librarians to delete reader accounts."""

    def post(self, request, pk, *args, **kwargs):

        if not request.user.is_librarian:
            return Response(
                {"error": "Only librarians can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )

        reader = get_object_or_404(User, pk=pk, role=User.Roles.READER)

        if BorrowRecord.objects.filter(user=reader, status=BorrowRecord.StatusChoices.BORROWED).exists():
            return Response({"error": "Reader still needs to return books."}, status=status.HTTP_400_BAD_REQUEST)

        name = reader.full_name
        reader.delete()
        return Response({"message": f"Reader '{name}' deleted successfully."},
                        status=status.HTTP_200_OK)


class IssueBookView(APIView):
    permission_classes = [IsAuthenticated]
    """View handling the physical allocation of a book copy to a system reader user."""

    def post(self, request, *args, **kwargs):
        if not request.user.is_librarian:
            return Response(
                {"error": "Only librarians can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        book_id = request.data.get('book_id')
        username = request.data.get('username')
        reader = get_object_or_404(User, username=username, role=User.Roles.READER)

        with transaction.atomic():
            book = get_object_or_404(Book.objects.select_for_update(), id=book_id)

            # Scenario handling validation guardrails
            if book.available_copies < 1:
                return Response(f"Operation Denied: '{book.title}' is completely checked out.",
                                status=status.HTTP_400_BAD_REQUEST)

            if BorrowRecord.objects.filter(user=reader, book=book, status=BorrowRecord.StatusChoices.BORROWED).exists():
                return Response(f"User {username} currently holds an unreturned copy of this volume.",
                                status=status.HTTP_400_BAD_REQUEST)

            book.available_copies -= 1
            book.save()

            BorrowRecord.objects.create(
                user=reader,
                book=book,
                due_date=timezone.now().date() + datetime.timedelta(days=14)  # 2-Week standard checkout period
            )
            return Response(f"Success: '{book.title}' effectively provisioned out to user {username}.",
                            status=status.HTTP_200_OK)


class ReturnBookView(APIView):
    permission_classes = [IsAuthenticated]
    """View handling processing returns, updating stock, and settling dynamic system fines."""

    def post(self, request, pk, *args, **kwargs):
        if not request.user.is_librarian:
            return Response(
                {"error": "Only librarians can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        with transaction.atomic():
            record = get_object_or_404(BorrowRecord.objects.select_for_update(), id=pk)

            if record.status == BorrowRecord.StatusChoices.RETURNED:
                return Response(
                    f"The book {record.book.title} issued by {record.user.full_name} has already been returned.",
                    status=status.HTTP_400_BAD_REQUEST)

            book = record.book
            book.available_copies += 1
            book.save()

            # Close loan metrics tracking window
            record.return_date = timezone.now().date()
            record.status = BorrowRecord.StatusChoices.RETURNED

            # Freeze accumulated dynamic penalties permanently to ledger
            current_fine = record.calculate_fine
            record.final_fine_amount = current_fine
            record.save()
            return Response(f"{book.title}' checked back into inventory cleanly.", status=status.HTTP_200_OK)


