import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Pipe, PipeTransform, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '../../utils/icon.service';
import { FireProvider } from '../../auth.service';
import { IsConnectedGuard } from '../guard';
import { AuthService,errorCode } from '../service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RivePlayer } from 'ng-rive';
import { MatInput } from '@angular/material/input';

interface FirebaseError {
  code: string;
  message: string;
}

@Component({
  selector: 'rive-auth-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SigninComponent {
  @ViewChild('error') error?: TemplateRef<any>;
  @ViewChild('errorAnim') errorAnim!: RivePlayer;
  showPwd = false;
  signing = false;
  passwordFocus?: boolean;
  form = new UntypedFormGroup({
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [Validators.required]),
  });

  constructor(
    icon: IconService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private guard: IsConnectedGuard,
    private snackbar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    icon.register('google');
    const email = this.route.snapshot.queryParamMap.get('email');
    this.form.get('email')?.setValue(email);
  }

  // See : https://firebase.google.com/docs/reference/js/firebase.auth.Auth
  private showError(err: { code: string, message: string }) {
    console.error(err);
    const [ _, code ] = err.code.split('/');
    if (this.error && errorCode.includes(code)) {
      this.snackbar.openFromTemplate(this.error, { data: err, duration: 3000 });
    }
  }

  async signinWith(provider: FireProvider) {
    this.signing = true;
    try {
      await this.auth.signin(provider);
      const redirect = this.guard.redirectUrl || '/profile';
      await this.router.navigate([redirect]);
    } catch(err: unknown) {
      this.showError(err as FirebaseError);
      this.signing = false;
      this.errorAnim.play = true;
    }
    this.cdr.markForCheck();
  }

  async signin() {
    if (this.form.valid) {
      this.signing = true;
      try {
        const { email, password } = this.form.value;
        await this.auth.signin(email, password);
        const redirect = this.guard.redirectUrl || '/profile';
        await this.router.navigate([redirect]);
      } catch (err) {
        this.showError(err as FirebaseError);
        this.signing = false;
        this.errorAnim.play = true;
      }
      this.cdr.markForCheck();
    }
  }

  async signup() {
    if (this.form.valid) {
      this.signing = true;
      try {
        const { email, password } = this.form?.value;
        await this.auth.signup(email, password);
        await this.router.navigate(['/auth/verification']);
      } catch (err) {
        this.showError(err as FirebaseError);
        this.signing = false;
      }
      this.cdr.markForCheck();
    } else {
      this.errorAnim.play = true;
      this.form.get('email')?.markAsTouched();
      this.form.get('password')?.markAsTouched();
    }
  }

  async resetPassword() {
    if (this.form.get('email')?.valid) {
      try {
        const { email } = this.form.value;
        await this.auth.auth.sendPasswordResetEmail(email);
        await this.router.navigate(['/auth/change-password', email]);
      } catch (err) {
        this.showError(err as FirebaseError);
      }
    } else {
      this.errorAnim.play = true;
      this.form.get('email')?.markAsTouched();
    }
  }
}

@Pipe({ name: 'pupilPostion', pure: false })
export class PupilPositionPipe implements PipeTransform {
  transform(input: MatInput, max: number = 6): number {
    if (input.focused) {
      return Math.min((input.value.length / 3) - max, max);
    } else {
      return 1;
    }
  }
}