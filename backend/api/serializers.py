from rest_framework import serializers
from .models import User, Driver, Vehicle, Ticket


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'PERSONNEL'),
            is_active=validated_data.get('is_active', True),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'


class VehicleSerializer(serializers.ModelSerializer):
    active_driver = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Vehicle
        fields = '__all__'


class TicketSerializer(serializers.ModelSerializer):
    vehicle = serializers.PrimaryKeyRelatedField(queryset=Vehicle.objects.all())
    driver = serializers.PrimaryKeyRelatedField(queryset=Driver.objects.all())

    class Meta:
        model = Ticket
        fields = '__all__'
