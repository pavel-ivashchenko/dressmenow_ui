

import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpInterceptor, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

import { User } from '@app/shared/interfaces';

type commonRes = Observable<never> | Observable<HttpResponse<{ status: 200, body: User }>>;
type successRes = Observable<HttpResponse<{ status: 200, body: User }>>;
type errorRes = Observable<never>;

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

  private users = JSON.parse(localStorage.getItem('users')) || [];
  private TOKEN_EXPIRES_IN = 20000000;
  private FAKE_TOKEN = 'fake-jwt-token';

  // id: user.id,
  // email: user.email,
  // firstName: user.firstName,
  // lastName: user.lastName,

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return of(null)
      .pipe(
        mergeMap(this.handleRoute(req, next)),
        materialize(),
        delay(500),
        dematerialize(),
      );
  }

  private handleRoute(req: HttpRequest<any>, next: HttpHandler): () => Observable<any> {
    return () => {
      const { url, method, body, headers } = req;
      switch (true) {
        case url.endsWith('/users/register') && method === 'POST':
          return this.register(body);
        case url.endsWith('/users/login') && method === 'POST':
          return this.login(body);
        case url.endsWith('/users/remind') && method === 'POST':
          return this.remind(body);
        case url.endsWith('/users/checkLogin') && method === 'POST':
          return this.checkLogin(body);
        case url.endsWith('/user') && method === 'GET':
          return this.getUser(headers);
        case url.endsWith('/users') && method === 'GET':
          return this.getUsers(headers);
        case url.match(/\/users\/\d+$/) && method === 'GET':
          return this.getUserById(headers, url);
        case url.match(/\/users\/\d+$/) && method === 'DELETE':
          return this.deleteUser(url, headers);
        default:
          return next.handle(req);
      }
    };
  }

  private login(body: { login: string; password: string }): commonRes {
    const { login, password } = body;
    const user = this.users.find(x => x.email === login && x.password === password);
    return !user ?
      this.error('User was not authenticated') :
      this.ok({
        // TODO in testing purposes token is an id of a user
        token: `${user.id}`,
        expiresIn: this.TOKEN_EXPIRES_IN
      });
  }

  private register(body: User): commonRes {
    const user = body;
    user.id = this.users.length ? Math.max(...this.users.map(x => x.id)) + 1 : 1;
    this.users.push(user);
    localStorage.setItem('users', JSON.stringify(this.users));

    return true ?
      this.ok(user) :
        this.error('User was not created');
  }

  private remind(email: string): successRes {
    return this.ok(true);
  }

  private getUser(headers: HttpHeaders): commonRes {
    return !this.isLoggedIn(headers) ?
      this.unauthorized() :
      this.ok(JSON.parse(localStorage.getItem('currentUser')));
  }

  private checkLogin(body: { email: string }): successRes {
    return this.ok(this.users.find(x => x.email === body.email));
  }

  private getUsers(headers: HttpHeaders): commonRes {
    return !this.isLoggedIn(headers) ?
      this.unauthorized() :
      this.ok(this.users);
  }

  private getUserById(headers: HttpHeaders, url: string): commonRes {
    return this.isLoggedIn(headers) ?
      this.ok(this.users.find(x => x.id === this.idFromUrl(url))) :
        this.unauthorized();
  }

  private deleteUser(url: string, headers: HttpHeaders): commonRes {
    return this.isLoggedIn(headers) ?
      this.ok( localStorage.setItem('users', JSON.stringify( this.users = this.users.filter(x => x.id !== this.idFromUrl(url) ))) ) :
        this.unauthorized();
  }

  private ok(bodyParam: any = null): successRes {
    return of(new HttpResponse({ status: 200, body: bodyParam }));
  }

  private unauthorized(): Observable<never> {
    return throwError({ status: 401, error: { message: 'Unauthorised' } });
  }

  private error(message: string): errorRes {
    return throwError({ error: { message } });
  }

  private isLoggedIn(headers: HttpHeaders): boolean {
    return headers.get('Authorization') === 'Bearer fake-jwt-token';
  }

  private idFromUrl(url: string): number {
    const urlParts = url.split('/');
    return parseInt(urlParts[urlParts.length - 1], 10);
  }

}
