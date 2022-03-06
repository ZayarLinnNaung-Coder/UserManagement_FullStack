import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import {AuthenticationService} from "../service/authentication.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authenticationService: AuthenticationService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if(request.url.includes(`${this.authenticationService.host}/user/login`)){
      return next.handle(request);
    }
    if(request.url.includes(`${this.authenticationService.host}/user/register`)){
      return next.handle(request);
    }

    this.authenticationService.loadTokenFromLocalStorage();
    const token = this.authenticationService.getTokenFromLocalStorage();
    const modifiedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(modifiedRequest)
    return next.handle(modifiedRequest);
  }
}
