import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {User} from "../../model/User";
import {AuthenticationService} from "../../service/authentication.service";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {NotificationType} from "../../enum/notification-type.enum";
import {NotificationService} from "../../service/notification.service";
import {Router} from "@angular/router";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {

  registerForm: FormGroup;
  isLoading: boolean;
  private subscription: Subscription[] = [];
  constructor(private formBuilder: FormBuilder,
              private authenticationService: AuthenticationService,
              private notificationService: NotificationService,
              private router: Router) { }


  ngOnInit(): void {
    if(this.authenticationService.isLoggedIn()){
      this.router.navigateByUrl('/user/management')
    }
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    })
  }

  register(user: User){
    this.isLoading = true;
    this.subscription.push(
      this.authenticationService.register(user).subscribe(
        (response: HttpResponse<User>) => {
          console.log(response);
          this.sendNotification(NotificationType.SUCCESS, `A new account is created for ${user.username}. Check your email => ${user.email}`)
          this.router.navigateByUrl('/login');
        },
        (errorResponse: HttpErrorResponse) => {
          this.sendNotification(NotificationType.ERROR, errorResponse.error.message);
        })
    )
  }

  private sendNotification(type: NotificationType, message: string){
    if(message){
      this.notificationService.notify(type, message);
    }else{
      this.notificationService.notify(type, "Unknown Error Occur");
    }
    this.isLoading = false;
  }

  ngOnDestroy() {
    this.subscription.forEach(sub => {
      sub.unsubscribe();
    })
  }
}
