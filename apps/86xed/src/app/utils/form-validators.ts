import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Collection of custom validators for enhanced form validation
 */
export class FormValidators {
  
  /**
   * Validates that password meets strong password criteria
   * - At least 8 characters
   * - Contains uppercase letter
   * - Contains lowercase letter  
   * - Contains number
   * - Contains special character
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[@$!%*?&]/.test(value);
      const hasMinLength = value.length >= 8;

      const isValid = hasUpper && hasLower && hasNumber && hasSpecial && hasMinLength;
      return isValid ? null : { 
        strongPassword: {
          hasUpper,
          hasLower,
          hasNumber,
          hasSpecial,
          hasMinLength
        }
      };
    };
  }

  /**
   * Validates that password confirmation matches password
   * Should be used as a form-level validator
   */
  static passwordMatch(passwordField = 'password', confirmPasswordField = 'confirmPassword'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get(passwordField);
      const confirmPassword = control.get(confirmPasswordField);

      if (!password || !confirmPassword) return null;
      
      const isMatching = password.value === confirmPassword.value;
      return isMatching ? null : { passwordMismatch: true };
    };
  }

  /**
   * Validates username format
   * - Only alphanumeric characters and underscores
   * - 3-20 characters
   */
  static username(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const isValidFormat = /^[a-zA-Z0-9_]+$/.test(value);
      const isValidLength = value.length >= 3 && value.length <= 20;

      if (!isValidFormat) return { usernameFormat: true };
      if (!isValidLength) return { usernameLength: true };

      return null;
    };
  }
}

/**
 * Helper function to get user-friendly error messages
 */
export function getValidationErrorMessage(fieldName: string, errors: ValidationErrors): string {
  const fieldLabel = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);

  // Common validation errors
  if (errors['required']) return `${fieldLabel} is required`;
  if (errors['email']) return 'Please enter a valid email address';
  if (errors['minlength']) {
    const requiredLength = errors['minlength'].requiredLength;
    return `${fieldLabel} must be at least ${requiredLength} characters`;
  }
  if (errors['maxlength']) {
    const requiredLength = errors['maxlength'].requiredLength;
    return `${fieldLabel} cannot exceed ${requiredLength} characters`;
  }

  // Custom validation errors
  if (errors['strongPassword']) return 'Password must contain uppercase, lowercase, number, and special character';
  if (errors['passwordMismatch']) return 'Passwords do not match';
  if (errors['usernameFormat']) return 'Username can only contain letters, numbers, and underscores';
  if (errors['usernameLength']) return 'Username must be 3-20 characters';

  // Default fallback
  return `Invalid ${fieldLabel.toLowerCase()}`;
}
