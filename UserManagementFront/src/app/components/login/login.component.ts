import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthenticationService} from "../../service/authentication.service";
import {Router} from "@angular/router";
import {User} from "../../model/User";
import {Subscription} from "rxjs";
import {NotificationType} from "../../enum/notification-type.enum";
import {NotificationService} from "../../service/notification.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {HeaderType} from "../../enum/header-type.enum";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  showLoading!: boolean;
  private subscriptions: Subscription[] = [];
  loginForm: FormGroup;

  constructor(private authenticationService: AuthenticationService,
              private router: Router,
              private notificationService: NotificationService,
              private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    if(this.authenticationService.isLoggedIn()){
      console.log("YES LOGIN")
      this.router.navigateByUrl('/user/management');
    }else{
      console.log("NO")
    }

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    })

    if(this.authenticationService.isLoggedIn()){
      this.router.navigateByUrl('/user/management');
    }else{
      this.router.navigateByUrl('/login');
    }
  }

  public onLogin(user: User){
    this.showLoading = true;
    console.log(user);
    this.subscriptions.push(
      this.authenticationService.login(user).subscribe(
        (response: HttpResponse<User>) => {
          const token = response.headers.get(HeaderType.JWT_TOKEN);
          this.authenticationService.saveTokenToLocalStorage(token);
          this.authenticationService.saveUserToLocalStorage(response.body);
          this.showLoading = false;
          this.router.navigateByUrl('/user/management');
        },
        (errorResponse: HttpErrorResponse) => {
          console.log(errorResponse);
          this.sendErrorNotification(NotificationType.ERROR, errorResponse.error.message);
          this.showLoading = false;
        }
      )
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    })
  }

  private sendErrorNotification(ERROR: NotificationType, message) {
    if(message){
      this.notificationService.notify(ERROR, message);
    }else{
      this.notificationService.notify(ERROR, 'AN ERROR OCCURED. PLEASE TRY AGIN.');
    }
  }
}
