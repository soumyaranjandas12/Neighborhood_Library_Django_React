from rest_framework import serializers
from library.models import Book, User, BorrowRecord


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = "__all__"


class CustomLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        style={'input_type': 'password'},
        trim_whitespace=False
    )


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ('password',)


class BorrowRecordSerializer(serializers.Serializer):
    book = BookSerializer()
    user = CustomUserSerializer()
    id = serializers.IntegerField()
    issue_date = serializers.DateField()
    due_date = serializers.DateField(required=False)
    return_date = serializers.DateField(required=False)


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'contact_no', 'role', 'full_name', 'address')
        extra_kwargs = {
            'password': {'write_only': True},
            'contact_no': {'required': True},
            'role': {'required': True},
            'full_name': {'required': True},
            'address': {'required': False},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')

        user = User(**validated_data)   # create user without password
        user.set_password(password)    # ✅ hash password
        user.save()

        return user
