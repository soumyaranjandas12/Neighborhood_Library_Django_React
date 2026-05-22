from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.CustomLoginView.as_view(), name='react-login'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('reader/<int:pk>/delete/', views.DeleteReaderView.as_view(), name='delete_reader'),
    path('readers/', views.ReadersListView.as_view(), name='list_readers'),
    path('readers/all/', views.AllReadersListView.as_view(), name='list_all_readers'),
    path('reader/issue_history/', views.ReaderIssuedHistoryView.as_view(), name='list_reader_issue_history'),

    # # Book Actions
    path('books/', views.BooksView.as_view(), name='list_books'),
    path('books/issued/', views.IssuedBooksView.as_view(), name='list_issued_books'),
    path('books/issue_history/', views.IssuedHistoryView.as_view(), name='list_books_issue_history'),

    path('books/', views.BooksView.as_view(), name='book_create'),
    path('book/<int:pk>/', views.BooksDetailView.as_view(), name='book_detail'),
    path('books/<int:pk>/', views.BooksView.as_view(), name='book_delete_update'),


    # #Transaction Actions
    path('issue/', views.IssueBookView.as_view(), name='issue_book'),
    path('return/<int:pk>/', views.ReturnBookView.as_view(), name='return_book'),
]
