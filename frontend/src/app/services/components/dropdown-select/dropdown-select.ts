import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption { value: string; label: string; }

@Component({
  selector: 'app-dropdown-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-select.html',
  styleUrl: './dropdown-select.css',
})
export class DropdownSelect {
  @Input() label = '';
  @Input() options: DropdownOption[] = [];
  @Input() value: string | null = null;
  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal(false);

  get selectedLabel(): string {
    const found = this.options.find((o) => o.value === this.value);
    return found ? found.label : this.label;
  }

  toggle(): void { this.isOpen.update((open) => !open); }
  select(option: DropdownOption): void { this.valueChange.emit(option.value); this.isOpen.set(false); }
  close(): void { this.isOpen.set(false); }
}