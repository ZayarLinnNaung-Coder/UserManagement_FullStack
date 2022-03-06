import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {UserService} from "../../service/user.service";
import {NotificationService} from "../../service/notification.service";
import {NotificationType} from "../../enum/notification-type.enum";
import {HttpErrorResponse} from "@angular/common/http";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomHttpResponse} from "../../model/CustomHttpResponse";
import {User} from "../../model/User";
import {Router} from "@angular/router";
import {AuthenticationService} from "../../service/authentication.service";
import {Role} from "../../enum/role.enum";
import {SubSink} from "subsink";

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit, OnDestroy {

  private titleSubject = new BehaviorSubject<string>('Users');
  private subs = new SubSink();
  titleAction$ = this.titleSubject.asObservable();
  users: User[];
  isLoading: boolean;
  selectedUser: User;
  newUserForm: FormGroup;
  updateUserForm: FormGroup;
  profileImage: File;
  loginUser: User;
  passwordResetForm: FormGroup;
  accountDetailForm: FormGroup;
  private tempProfileImgToUpdate: File;

  constructor(private userService: UserService,
              private notificationService: NotificationService,
              private formBuilder: FormBuilder,
              private router: Router,
              private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    this.loginUser = JSON.parse(localStorage.getItem('user'));
    console.log(this.loginUser)
    this.getUsers(true);
    this.newUserForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['ROLE_USER'],
      active: [false],
      notLocked: [false]
    });

    this.updateUserForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['ROLE_USER'],
      active: [false],
      notLocked: [false]
    });

    this.passwordResetForm = this.formBuilder.group({
      email: ['', [Validators.email]]
    })

    this.accountDetailForm = this.formBuilder.group({
      firstName: [this.loginUser.firstName, [Validators.required]],
      lastName: [this.loginUser.lastName, [Validators.required]],
      username: [this.loginUser.username, [Validators.required]],
      email: [this.loginUser.email, [Validators.required, Validators.email]],
      role: [this.loginUser.role],
      active: [this.loginUser.active],
      notLocked: [this.loginUser.notLocked]
    })

    document.getElementById('profileImageInput').addEventListener('change', (e) => {
      const profileImg = (<HTMLInputElement>e.target).files[0];
      this.tempProfileImgToUpdate = profileImg;
      const reader = new FileReader();
      reader.onloadend = () => {
        document.getElementById('profileImage').setAttribute('src', reader.result as string);
      }
      const encodedProfileImg = reader.readAsDataURL(profileImg);
      // console.log(encodedProfileImg)
    })
  }

  changeTitle(title: string){
    this.titleSubject.next(title);
  }

  getUsers(sendNotification: boolean){
    this.isLoading = true;
    this.subs.add(
      this.userService.getUsers().subscribe(
        (users: User[]) => {
          this.users = users;
          this.isLoading = false;
          localStorage.setItem('users', JSON.stringify(users))
          if(sendNotification){
            this.showNotification(NotificationType.SUCCESS, `Fetched ${users.length} users successfully`);
          }
        },
        (httpErrorResponse: HttpErrorResponse)=>{
          this.showNotification(NotificationType.ERROR, httpErrorResponse.message);
        })
    );
  }

  showDialogBox(user: User){
    this.selectedUser = user;
    document.getElementById('dialogButton').click();
  }

  showAddBox() {
    document.getElementById('addBoxButton').click();
  }

  addNewUser(user: User) {
    const formData = this.userService.createUserFromData(null, user, this.profileImage);
    localStorage.getItem('users');
    this.subs.add(
      this.userService.addUser(formData).subscribe(
        (user: User) => {
          this.getUsers(false);
          document.getElementById('userAddCloseBtn').click();
        },
        (httpErrorResponse: HttpErrorResponse) => {
          this.showNotification(NotificationType.ERROR, httpErrorResponse.message);
        }
      )
    )
  }

  onFileInputChange(eventTarget: any) {
    this.profileImage = eventTarget.files[0];
  }

  searchUsers(searchQuery:string) {
    let filterUsers: User[] = [];
    console.log(this.users)
    let savedUsers: User[] = JSON.parse(localStorage.getItem('users'));
    savedUsers.forEach((user: User) => {
      if(user.firstName.toLowerCase().indexOf(searchQuery.toLowerCase()) != -1){
        filterUsers.push(user);
      }
    })
    console.log(filterUsers)
    if(filterUsers != null){
      this.users = filterUsers;
    }
  }

  updateDialogBox(user) {
    let isInit:boolean = true;
    this.selectedUser = user;
    this.updateUserForm = this.formBuilder.group({
      firstName: [this.selectedUser.firstName, [Validators.required]],
      lastName: [this.selectedUser.lastName, [Validators.required]],
      username: [this.selectedUser.username, [Validators.required]],
      email: [this.selectedUser.email, [Validators.required, Validators.email]],
      role: [this.selectedUser.role],
      active: [this.selectedUser.active],
      notLocked: [this.selectedUser.notLocked]
    });
    document.getElementById('updateBoxButton').click();
  }


  updateUser(user: User) {
    let profileImage: File;
    if(this.profileImage == undefined){
      profileImage = this.urlToFile(user.profileImageUrl, user.username);
    }else{
      profileImage = this.profileImage;
    }
    const formData = this.userService.createUserFromData(user.username, user, profileImage);
    this.subs.add(
      this.userService.updateUser(formData).subscribe(
        (user: User) => {
          this.showNotification(NotificationType.SUCCESS, 'Updated successfully');
          this.getUsers(false);
          document.getElementById('userUpdateCloseBtn').click();
        },
        (errorResponse: HttpErrorResponse) => {
          this.showNotification(NotificationType.ERROR, errorResponse.message);
        })
    );
  }


  updateCurrentUser(user: User) {
    console.log(user, this.tempProfileImgToUpdate);
    const formData = this.userService.createUserFromData(user.username, user, this.tempProfileImgToUpdate);
    this.subs.add(
      this.userService.updateUser(formData).subscribe(
        (user: User) => {
          this.showNotification(NotificationType.SUCCESS, 'Updated successfully');
          this.getUsers(false);
          localStorage.setItem('user', JSON.stringify(user))
        },
        (errorResponse: HttpErrorResponse) => {
          this.showNotification(NotificationType.ERROR, errorResponse.message);
        }
      )
    )
  }

  private urlToFile(url: string, fileName: string){
    let outputFile: File;
    fetch(url).then(async response => {
      // const contentType = response.headers.get('content-type');
      const blob = await response.blob()
      outputFile = new File([blob], fileName + '.jpeg');
    })

    return outputFile;
  }

  private showNotification(type: NotificationType, message: string) {
    if(message){
      this.notificationService.notify(type, message);
    }else{
      this.notificationService.notify(type, "Unknown error occur");
    }
  }

  deleteUser(username: string) {
    this.subs.add(
      this.userService.deleteUser(username).subscribe(
        (customHttpResponse: CustomHttpResponse) => {
          this.getUsers(false);
          this.showNotification(NotificationType.SUCCESS, 'User deleted successfully');
        },
        (error: HttpErrorResponse) => {
          this.showNotification(NotificationType.ERROR, error.error.message);
        })
    )
  }

  isAdmin():boolean{
    return this.getUserRole() === Role.ADMIN || this.getUserRole() === Role.SUPER_ADMIN;
  }

  isAdminOrManager():boolean{
    return this.isAdmin() || this.getUserRole() === Role.MANAGER;
  }

  private getUserRole(): string{
    return this.authenticationService.getUserFromLocalStorage().role;
  }

  onPasswordReset(form: any) {
    const emailAddress = form.email;
    this.isLoading = true;
    this.subs.add(
      this.userService.resetPassword(emailAddress).subscribe(
        (httpResponse: CustomHttpResponse) => {
          this.showNotification(NotificationType.SUCCESS, `Check new password in ${emailAddress}`);
          this.isLoading = false;
        },
        (errorResponse: HttpErrorResponse) => {
          this.showNotification(NotificationType.ERROR, errorResponse.error.message)
        })
    )
  }

  onLogout() {
    localStorage.removeItem('users');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigateByUrl('/login');
    this.showNotification(NotificationType.SUCCESS, 'Successfully logout');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
