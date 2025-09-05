import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SupabaseService } from '../../../services/api/supabase.service';
import { FormValidators, getValidationErrorMessage } from '../../../utils';

// Core Services
// Utils
// Types
interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SocialProvider {
  name: string;
  icon: string;
  handler: () => Promise<void>;
}

@Component({
  selector: 'x86-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  // Component state (migrated from signals)
  isLoading = false;
  errorMessage = '';

  // Form configuration
  readonly registerForm = this.createForm();

  // Social providers configuration
  readonly socialProviders: SocialProvider[] = [
    {
      name: 'Google',
      icon: '🔍',
      handler: () => this.signUpWithProvider('google'),
    },
    {
      name: 'Facebook',
      icon: '📘',
      handler: () => this.signUpWithProvider('facebook'),
    },
    {
      name: 'Amazon',
      icon: '📦',
      handler: () => this.signUpWithProvider('amazon'),
    },
  ];

  ngOnInit(): void {
    this.focusFirstField();
  }

  async onSubmit(): Promise<void> {
    if (!this.registerForm.valid || this.isLoading) return;

    this.setLoadingState(true);
    const formData = this.registerForm.value as RegisterFormData;

    try {
      await this.supabaseService.signUp(
        formData.email,
        formData.password,
        formData.username
      );
      await this.router.navigate(['/profile']);
    } catch (error) {
      this.handleRegistrationError(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  getFieldError(fieldName: keyof RegisterFormData): string | null {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors || !field.touched) return null;

    // Check form-level errors for confirmPassword
    if (
      fieldName === 'confirmPassword' &&
      this.registerForm.errors?.['passwordMismatch']
    ) {
      return 'Passwords do not match';
    }

    return getValidationErrorMessage(fieldName, field.errors);
  }

  // Private methods
  private createForm() {
    return this.formBuilder.group(
      {
        username: ['', [Validators.required, FormValidators.username()]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, FormValidators.strongPassword()]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: FormValidators.passwordMatch(),
      }
    );
  }

  private focusFirstField(): void {
    setTimeout(() => {
      document.getElementById('username')?.focus();
    }, 100);
  }

  private setLoadingState(loading: boolean): void {
    this.isLoading = loading;
    if (loading) this.errorMessage = '';
  }

  private handleRegistrationError(error: any): void {
    console.error('Registration error:', error);

    const errorMessages: Record<string, string> = {
      email:
        'This email address is already registered. Please use a different email or sign in.',
      username:
        'This username is already taken. Please choose a different username.',
      default: 'Failed to create account. Please try again.',
    };

    const messageKey =
      Object.keys(errorMessages).find((key) =>
        error?.message?.toLowerCase().includes(key)
      ) || 'default';

    this.errorMessage = errorMessages[messageKey];
  }

  private async signUpWithProvider(provider: string): Promise<void> {
    this.setLoadingState(true);

    try {
      // TODO: Implement actual OAuth integration
      console.log(`${provider} sign-up - implementation pending`);
      this.errorMessage = `${
        provider.charAt(0).toUpperCase() + provider.slice(1)
      } sign-up coming soon!`;
    } catch (error) {
      console.error(`${provider} sign-up error:`, error);
      this.errorMessage = `Failed to sign up with ${provider}. Please try again.`;
    } finally {
      this.setLoadingState(false);
    }
  }
}
