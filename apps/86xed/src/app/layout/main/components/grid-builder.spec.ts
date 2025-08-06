import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GridBuilder } from './grid-builder';

describe('GridBuilder', () => {
  let component: GridBuilder;
  let fixture: ComponentFixture<GridBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GridBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(GridBuilder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
