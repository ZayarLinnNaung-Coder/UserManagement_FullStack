import { Injectable } from '@angular/core';
import { environment} from "../../environments/environment";
import {HttpClient, HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {Observable} from "rxjs";
import {User} from "../model/User";
import {JwtHelperService} from "@auth0/angular-jwt";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private _host: string = environment.apiUrl;
  private token: string = '';
  private loginUsername: string = '';
  private jwtHelper = new JwtHelperService();

  constructor(private httpClient: HttpClient) { }

  login(user: User): Observable<HttpResponse<User> | HttpErrorResponse>{
    return this.httpClient.post<User>(
      `${this._host}/user/login`, user, {observe: "response"}
    );
  }

  register(user: User): Observable<HttpResponse<User> | HttpErrorResponse>{
    console.log(user)
    return this.httpClient.post<User>(
      `${this._host}/user/register`, user, {observe: "response"}
    );
  }

  logout(): void{
    this.token = '';
    this.loginUsername = '';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('users');
  }

  saveTokenToLocalStorage(token: string): void{
    this.token = token;
    localStorage.setItem('token', this.token);
  }

  loadTokenFromLocalStorage(): void{
    this.token = localStorage.getItem('token') as string;
  }

  getTokenFromLocalStorage(): string{
    return this.token;
  }

  saveUserToLocalStorage(user: User): void{
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUserFromLocalStorage(): User{
    return JSON.parse(localStorage.getItem('user') as string);
  }

  isLoggedIn(): boolean{
     this.loadTokenFromLocalStorage();
     if(this.token != null || this.token != ''){
        if(!this.jwtHelper.isTokenExpired(this.token)){
          const user: User = JSON.parse(localStorage.getItem('user'));
          this.loginUsername = user.username;
          return true;
        }
     }else{
       this.logout();
     }
    return false;
  }

  get host(): string {
    return this._host;
  }

  set host(value: string) {
    this._host = value;
  }
}
