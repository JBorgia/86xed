import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// Core Services
import { SupabaseService } from '../../../services/api/supabase.service';

// Utils
import { getValidationErrorMessage } from '../../../utils';

// Types
interface LoginFormData {
  email: string;
  password: string;
}

interface SocialProvider {
  name: string;
  icon: string;
  handler: () => Promise<void>;
}

@Component({
  selector: 'x86-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);

  // Component state
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  // Form configuration
  readonly loginForm = this.createForm();

  // Social providers configuration
  readonly socialProviders: SocialProvider[] = [
    {
      name: 'Google',
      icon: '🔍',
      handler: () => this.signInWithProvider('google'),
    },
    {
      name: 'Facebook',
      icon: '📘',
      handler: () => this.signInWithProvider('facebook'),
    },
    {
      name: 'Amazon',
      icon: '📦',
      handler: () => this.signInWithProvider('amazon'),
    },
  ];

  ngOnInit(): void {
    this.focusFirstField();
  }

  async onSubmit(): Promise<void> {
    if (!this.loginForm.valid || this.isLoading()) return;

    this.setLoadingState(true);
    const formData = this.loginForm.value as LoginFormData;

    try {
      await this.supabaseService.signIn(formData.email, formData.password);
      await this.router.navigate(['/profile']);
    } catch (error) {
      this.handleLoginError(error);
    } finally {
      this.setLoadingState(false);
    }
  }

  getFieldError(fieldName: keyof LoginFormData): string | null {
    const field = this.loginForm.get(fieldName);
    if (!field?.errors || !field.touched) return null;

    return getValidationErrorMessage(fieldName, field.errors);
  }

  // Private methods
  private createForm() {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private focusFirstField(): void {
    setTimeout(() => {
      document.getElementById('email')?.focus();
    }, 100);
  }

  private setLoadingState(loading: boolean): void {
    this.isLoading.set(loading);
    if (loading) this.errorMessage.set('');
  }

  private handleLoginError(error: any): void {
    console.error('Login error:', error);
    this.errorMessage.set('Invalid email or password. Please try again.');
  }

  private async signInWithProvider(provider: string): Promise<void> {
    this.setLoadingState(true);

    try {
      // TODO: Implement actual OAuth integration
      console.log(`${provider} sign-in - implementation pending`);
      this.errorMessage.set(
        `${
          provider.charAt(0).toUpperCase() + provider.slice(1)
        } sign-in coming soon!`
      );
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      this.errorMessage.set(
        `Failed to sign in with ${provider}. Please try again.`
      );
    } finally {
      this.setLoadingState(false);
    }
  }
}
