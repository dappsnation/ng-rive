import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './service';

// Remove "#" & trailing "/"
function cleanUrl(url: string) {
  return url.split('/').filter(segment => !!segment).map(segment => segment.replace('#', '')).join('/');
}

@Injectable({ providedIn: 'root' })
export class IsConnectedGuard  {
  redirectUrl?: string;
  
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    this.redirectUrl = cleanUrl(state.url);

    const user = await this.auth.getUser();
    if (!user) {
      return this.router.createUrlTree(['/auth']);
    }
    if (!user.emailVerified) {
      return this.router.createUrlTree(['/auth/verification']);
    }
    
    const profile = await this.auth.getValue();
    if (!profile) {
      return this.router.createUrlTree(['/auth']);
    }

    delete this.redirectUrl;
    return true;
  }
}


@Injectable({ providedIn: 'root' })
export class IsNotConnectedGuard  {  
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const user = await this.auth.getUser();
    if (state.url.startsWith('/auth/action')) {
      return true;
    }
    if (!user) {
      return true
    }
    if (!user.emailVerified) {
      if (state.url === '/auth/verification') return true;
      return this.router.createUrlTree(['/auth/verification']);
    }
    if (state.url.startsWith('/home')) {
      const url = state.url.replace('/home', '/b');
      return this.router.createUrlTree([url]);
    }
    return this.router.createUrlTree(['/b']);
  }
}
