package demo.zware.usermanagement.resource;

import demo.zware.usermanagement.domain.HttpResponse;
import demo.zware.usermanagement.domain.User;
import demo.zware.usermanagement.domain.UserPrinciple;
import demo.zware.usermanagement.exception.ExceptionHandling;
import demo.zware.usermanagement.exception.domain.*;
import demo.zware.usermanagement.service.UserService;
import demo.zware.usermanagement.utility.JwtTokenProvider;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.mail.MessagingException;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.List;

import static demo.zware.usermanagement.constant.FileConstant.*;
import static demo.zware.usermanagement.constant.SecurityConstant.JWT_TOKEN_HEADER;
import static org.springframework.http.MediaType.IMAGE_JPEG_VALUE;

@RestController
@RequestMapping("/user")
public class UserResource extends ExceptionHandling {

    public static final String EMAIL_IS_SENT_TO = "Email is sent to: ";
    public static final String USER_DELETED_SUCCESSFULLY = "User deleted successfully";
    private UserService userService;
    private AuthenticationManager authenticationManager;
    private JwtTokenProvider jwtTokenProvider;

    public UserResource(UserService userService, AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) throws UserNotFoundException, UsernameExistException, EmailExistException, MessagingException {
        User newUser = userService.register(user.getFirstName(), user.getLastName(), user.getUsername(), user.getEmail());
        return new ResponseEntity<>(newUser, HttpStatus.OK);
    }

    @PostMapping("/add")
    public ResponseEntity<User> addUser(
            @RequestParam("firstName") String firstName, @RequestParam("lastName") String lastName,
            @RequestParam("username") String username, @RequestParam("email") String email,
            @RequestParam("role") String role, @RequestParam("isActive") String isActive,
            @RequestParam("isNonLocked") String isNonLocked, @RequestParam(value = "profileImage", required = false) MultipartFile profileImage
            ) throws UserNotFoundException, UsernameExistException, EmailExistException, IOException, NotAnImageFileException {
        User addedUser = this.userService.addNewUser(
                firstName, lastName, username, email, role, Boolean.parseBoolean(isNonLocked),
                Boolean.parseBoolean(isActive), profileImage
        );
        return new ResponseEntity<>(addedUser, HttpStatus.OK);
    }

    @PostMapping("/update")
    public ResponseEntity<User> updateUser(
            @RequestParam("currentUsername") String currentUsername,
            @RequestParam("firstName") String firstName, @RequestParam("lastName") String lastName,
            @RequestParam("username") String username, @RequestParam("email") String email,
            @RequestParam("role") String role, @RequestParam("isActive") String isActive,
            @RequestParam("isNonLocked") String isNonLocked, @RequestParam(value = "profileImage", required = false) MultipartFile profileImage
            ) throws UserNotFoundException, UsernameExistException, EmailExistException, IOException, NotAnImageFileException {
        User updatedUser = this.userService.updateUser(
                currentUsername, firstName, lastName, username, email, role,
                Boolean.parseBoolean(isNonLocked), Boolean.parseBoolean(isActive), profileImage
        );
        return new ResponseEntity<>(updatedUser, HttpStatus.OK);
    }

    @GetMapping("/find/{username}")
    public ResponseEntity<User> getUser(@PathVariable("username") String username){
        User user = this.userService.findUserByUsername(username);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @GetMapping("/list")
    public ResponseEntity<List<User>> getAllUsers(){
        List<User> userList = this.userService.getUsers();
        return new ResponseEntity<>(userList, HttpStatus.OK);
    }

    @GetMapping("/resetPassword/{email}")
    public ResponseEntity<HttpResponse> resetPassword(@PathVariable("email") String email) throws EmailNotFoundException, MessagingException {
        this.userService.resetPassword(email);
        return response(HttpStatus.OK, EMAIL_IS_SENT_TO + email);
    }

    @DeleteMapping("/delete/{username}")
    @PreAuthorize("hasAnyAuthority('user:delete')")
    public ResponseEntity<HttpResponse> deleteUser(@PathVariable("username") String username) throws IOException {
        User user = this.userService.findUserByUsername(username);
        Path imagePath = Paths.get(USER_FOLDER + username).toAbsolutePath().normalize();
        FileUtils.deleteDirectory(new File(imagePath.toString()));
        this.userService.deleteUser(user.getId());
        return response(HttpStatus.OK, USER_DELETED_SUCCESSFULLY);
    }

    @PostMapping("/updateProfileImage")
    public ResponseEntity<User> updateProfileImage(@RequestParam("username") String username, @RequestParam("profileImage") MultipartFile profileImage) throws UserNotFoundException, UsernameExistException, EmailExistException, IOException, NotAnImageFileException {
        User user = this.userService.updateProfileImage(username, profileImage);
        return new ResponseEntity<>(user, HttpStatus.OK);
    }

    @GetMapping(path = "/image/{username}/{fileName}", produces = IMAGE_JPEG_VALUE)
    public byte[] getProfileImage(@PathVariable("username") String username, @PathVariable("fileName") String fileName) throws IOException {
        return Files.readAllBytes(Paths.get(USER_FOLDER + username + FORWARD_SLASH + fileName));
    }

    @GetMapping(path = "/image/profile/{username}", produces = IMAGE_JPEG_VALUE)
    public byte[] getTemporaryProfileImage(@PathVariable("username") String username) throws IOException {
        URL url = new URL(TEMP_PROFILE_IMAGE_BASE_URL + username);
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try(InputStream inputStream = url.openStream()){
            int byteRead;
            byte[] chunk = new byte[1024];
            while((byteRead = inputStream.read(chunk)) > 0){
                byteArrayOutputStream.write(chunk, 0, byteRead);
            }
        }
        return byteArrayOutputStream.toByteArray();
    }

    private ResponseEntity<HttpResponse> response(HttpStatus status, String message) {
        HttpResponse body = new HttpResponse(
                status.value(), status, status.getReasonPhrase(), message
        );
        return new ResponseEntity<>(body, status);
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody User user){
        authenticate(user.getUsername(), user.getPassword());
        User loginUser = userService.findUserByUsername(user.getUsername());
        UserPrinciple userPrinciple = new UserPrinciple(loginUser);
        HttpHeaders jwtHeader = getJwtHeader(userPrinciple);
        return new ResponseEntity<>(loginUser, jwtHeader, HttpStatus.OK);
    }

    private HttpHeaders getJwtHeader(UserPrinciple userPrinciple) {
        HttpHeaders headers =  new HttpHeaders();
        headers.add(JWT_TOKEN_HEADER, this.jwtTokenProvider.generateJwtToken(userPrinciple));
        return headers;
    }

    private void authenticate(String username, String password) {
        this.authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
    }
}
