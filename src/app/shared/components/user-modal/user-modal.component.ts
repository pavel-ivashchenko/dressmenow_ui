
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { Subject, Observable } from 'rxjs';
import { tap, scan, map, shareReplay, startWith, distinctUntilChanged, first } from 'rxjs/operators';

import { AuthenticationService } from '@app/core/services';
import { preventDefault$, stopEvent } from '@app/shared/helpers';
import { User } from '@app/shared/interfaces';

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserModalComponent implements OnInit {

  private preventDefault$ = preventDefault$;
  private afterLoginURL = '/user'; // TODO change to appropriate name

  public signInForm: FormGroup;
  public remindPasswordForm: FormGroup;
  public createAccountForm: FormGroup;

  public views: { [key: string]: string } = {
    default: 'DEFAULT',
    remindPassword: 'REMIND_PASSWORD',
    createAccount: 'CREATE_ACCOUNT',
    checkEmail: 'CHECK_EMAIL',
    alreadyExists: 'ALREADY_EXISTS',
    notExists: 'NOT_EXISTS',
    afterCreate: 'AFTER_CREATE'
  };
  public regSteps: string[] = ['email', 'name', 'password'];
  public hidePassword$: Observable<any> = new Subject().pipe(
    distinctUntilChanged(),
    scan((acc) => acc = !acc, false)
  );
  public currView$: any = new Subject()
    .pipe(
      distinctUntilChanged(),
      this.preventDefault$,
      scan((acc, viewName) => acc = viewName, this.views.default),
      shareReplay()
    );
  public currRegIdx = 0;
  public passwordErrors$: Observable<{ [ key: string ]: string }>;

  constructor(
    private dialogRef: MatDialogRef<UserModalComponent>,
    private authenticationService: AuthenticationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.signInForm = this.getSignInForm();
    this.createAccountForm = this.getCreateAccountForm();
    this.remindPasswordForm = new FormGroup({ email: new FormControl('') });
    this.passwordErrors$ = this.getErrorsObservable(this.createAccountForm.controls.createPassword);
  }

  public onCloseModal(): void {
    this.dialogRef.close();
  }

  public onSignIn(): void {
    if (this.signInForm.invalid) { return; }
    this.authenticationService.login(this.signInForm.value.login, this.signInForm.value.password)
      .pipe(first())
      .subscribe( (res: User | null) => { if (res) { this.router.navigate([ this.afterLoginURL ]); } } );
  }

  public onRemindPassword(event: MouseEvent): void {
    if (this.remindPasswordForm.invalid) { return; }
    this.authenticationService.remindPassword(this.remindPasswordForm.value.email)
      .pipe(first())
      .subscribe(
        (res: boolean) => {
          res ?
            this.currView$.next([this.views.checkEmail, event]) :
              this.currView$.next([this.views.notExists, event]);
        }
      );
  }

  public onCreateAccount(event: MouseEvent): void {
    stopEvent(event);
    if (this.createAccountForm.invalid) { return; }
    this.authenticationService.createAccount(this.createAccountForm.value)
      .subscribe((res: User | null) => {
        if (res) {
          this.currView$.next([this.views.afterCreate]);
          this.createAccountForm = this.getCreateAccountForm();
          this.passwordErrors$ = this.getErrorsObservable(this.createAccountForm.controls.createPassword);
          this.currRegIdx = 0;
        }
      });
  }

  public gotoRegStep(event: MouseEvent, stepIdx: number): void {
    stopEvent(event);
    const currForm = this.createAccountForm.controls[ this.regSteps[this.currRegIdx] ];
    if (((this.currRegIdx - stepIdx < 0) && currForm.valid) || this.currRegIdx - stepIdx > 0) {
      this.currRegIdx = stepIdx;
      this.cdr.detectChanges();
    }
  }

  public checkEmail(event: MouseEvent): void {
    stopEvent(event);
    if (this.createAccountForm.controls.email.invalid) { return; }
    this.authenticationService.checkLogin(this.createAccountForm.value.email.email_1)
      .pipe(first())
      .subscribe(
        (res: boolean) =>
          res ?
            this.currView$.next([this.views.alreadyExists]) :
              this.gotoRegStep(event, 1)
      );
  }

  private getCreateAccountForm(): FormGroup {
    return new FormGroup({
      email: new FormGroup({
        email_1: new FormControl(''),
        email_2: new FormControl(''),
        sendnews: new FormControl('true')
      }),
      name: new FormGroup({
        firstName: new FormControl(''),
        lastName: new FormControl('')
      }),
      createPassword: new FormControl('')
    });
  }

  private getSignInForm(): FormGroup {
    return new FormGroup({
      login: new FormControl(''),
      password: new FormControl('')
    });
  }

  private getErrorsObservable(ctrl: AbstractControl):
    Observable<{ [ key: string ]: string }> {
      return ctrl.statusChanges
        .pipe(
          startWith(''),
          map(_ => ctrl.errors || {}),
          shareReplay(1)
        );
    }

}
