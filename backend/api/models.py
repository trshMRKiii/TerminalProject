from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
    ROLE_CHOICES = [('PERSONNEL', 'Personnel'), ('SUPERVISOR', 'Supervisor'), ('MANAGER', 'Manager')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='PERSONNEL')
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['role', 'is_active'])]

class Driver(models.Model):
    STATUS_CHOICES = [('ACTIVE', 'Active'), ('INACTIVE', 'Inactive')]
    
    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100, db_index=True)
    contact = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_archived = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [models.Index(fields=['status', 'is_archived'])]

# operations/models.py
class Vehicle(models.Model):
    STATUS_CHOICES = [('AVAILABLE', 'Available'), ('ON_TRIP', 'On Trip'), ('MAINTENANCE', 'Maintenance')]
    
    id = models.CharField(max_length=20, primary_key=True)
    plate_number = models.CharField(unique=True, max_length=20, db_index=True)
    unit_number = models.CharField(unique=True, max_length=20, db_index=True)
    route = models.CharField(max_length=100, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    active_driver = models.ForeignKey(Driver, null=True, blank=True, on_delete=models.SET_NULL)
    is_archived = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'is_archived']),
            models.Index(fields=['route', 'is_archived']),
        ]

class Ticket(models.Model):
    STATUS_CHOICES = [('ISSUED', 'Issued'), ('DISPATCHED', 'Dispatched'), ('COLLECTED', 'Collected'), ('CANCELLED', 'Cancelled')]
    
    id = models.CharField(max_length=20, primary_key=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='tickets')
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='tickets')
    route = models.CharField(max_length=100, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ISSUED')
    collection_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    issued_at = models.DateTimeField(auto_now_add=True, db_index=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    nullified_at = models.DateTimeField(null=True, blank=True)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'is_verified']),
            models.Index(fields=['issued_at', 'status']),
        ]
