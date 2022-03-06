import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpEvent} from "@angular/common/http";
import {Observable} from "rxjs";
import {User} from "../model/User";
import {environment} from "../../environments/environment";
import {CustomHttpResponse} from "../model/CustomHttpResponse";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private host: string = environment.apiUrl;

  constructor(private httpClient: HttpClient) { }

  getUsers(): Observable<User[] | HttpErrorResponse>{
    return this.httpClient.get<User[]>(`${this.host}/user/list`);
  }

  addUser(formData: FormData): Observable<User | HttpErrorResponse>{
    return this.httpClient.post<User>(`${this.host}/user/add`, formData);
  }

  updateUser(formData: FormData): Observable<User | HttpErrorResponse>{
    return this.httpClient.post<User>(`${this.host}/user/update`, formData);
  }

  resetPassword(email: string): Observable<CustomHttpResponse | HttpErrorResponse>{
    return this.httpClient.get<CustomHttpResponse>(`${this.host}/user/resetPassword/${email}`);
  }

  updateProfileImage(formData: FormData): Observable<HttpEvent<User> | HttpErrorResponse>{
    return this.httpClient.post<User>(
      `${this.host}/user/updateProfileImage`, formData,
      {reportProgress: true, observe: "events"}
    );
  }

  deleteUser(username: string): Observable<CustomHttpResponse | HttpErrorResponse>{
    return this.httpClient.delete<CustomHttpResponse>(`${this.host}/user/delete/${username}`);
  }

  addUsersToLocalStorage(users: User[]){
    localStorage.setItem('users', JSON.stringify(users));
  }

  getUsersFromLocalStorage(): User[] | null{
    const users = localStorage.getItem('users');
    if(users){
      return JSON.parse(users);
    }
    return null;
  }

  createUserFromData(loggedInUsername: string, user: User, profileImage: File): FormData{
    const formData = new FormData();
    formData.append('currentUsername', loggedInUsername);
    formData.append('firstName', user.firstName);
    formData.append('lastName', user.lastName);
    formData.append('username', user.username);
    formData.append('email', user.email);
    formData.append('role', user.role);
    formData.append('profileImage', profileImage);
    formData.append('isActive', JSON.stringify(user.active));
    formData.append('isNonLocked', JSON.stringify(user.notLocked));
    formData.append('joinDate', new Date().toDateString());
    return formData;
  }


}
