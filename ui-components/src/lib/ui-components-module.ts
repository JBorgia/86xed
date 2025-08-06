import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './base/button/button.component';
import { InputComponent } from './base/input/input.component';
import { SelectComponent } from './base/select/select.component';
import { CheckboxComponent } from './base/checkbox/checkbox.component';
import { RadioComponent } from './base/radio/radio.component';
import { TextareaComponent } from './base/textarea/textarea.component';
import { ToggleComponent } from './base/toggle/toggle.component';
import { ModalComponent } from './base/modal/modal.component';
import { DropdownComponent } from './base/dropdown/dropdown.component';

@NgModule({
  imports: [
    CommonModule,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    RadioComponent,
    TextareaComponent,
    ToggleComponent,
    ModalComponent,
    DropdownComponent
  ],
  exports: [
    ButtonComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent,
    RadioComponent,
    TextareaComponent,
    ToggleComponent,
    ModalComponent,
    DropdownComponent
  ]
})
export class UiComponentsModule {}
