package demo.zware.usermanagement.utility;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import demo.zware.usermanagement.constant.SecurityConstant;
import demo.zware.usermanagement.domain.UserPrinciple;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static java.util.Arrays.stream;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    public String generateJwtToken(UserPrinciple userPrinciple){
        String[] claims = getClaimsFromUserPrinciple(userPrinciple);
        return JWT.create()
                .withIssuer(SecurityConstant.GRAY_TECH_FIELD_FAMILY).withAudience(SecurityConstant.GET_ARRAYS_ADMINISTRATION)
                .withArrayClaim(SecurityConstant.AUTHORITIES, claims).withExpiresAt(new Date(System.currentTimeMillis() + SecurityConstant.EXPIRATION_TIME))
                .sign(Algorithm.HMAC512(this.secret.getBytes(StandardCharsets.UTF_8)));
    }

    public List<GrantedAuthority> getAuthorities(String token){
        String[] claims = getClaimsFromToken(token);
        return stream(claims).map(SimpleGrantedAuthority::new).collect(Collectors.toList());
    }

    public Authentication getAuthentication(String username, List<GrantedAuthority> authorities, HttpServletRequest request){
        UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken =
                new UsernamePasswordAuthenticationToken(username, null, authorities);
        usernamePasswordAuthenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        return usernamePasswordAuthenticationToken;
    }

    public boolean isTokenValid(String username, String token){
        JWTVerifier verifier = getJwtVerifier();
        return StringUtils.isEmpty(username) && !isTokenExpired(verifier, token);
    }

    public String getSubject(String token){
        JWTVerifier verifier = getJwtVerifier();
        return verifier.verify(token).getSubject();
    }

    private boolean isTokenExpired(JWTVerifier verifier, String token) {
        Date expiredDate = verifier.verify(token).getExpiresAt();
        return expiredDate.before(new Date());
    }

    private String[] getClaimsFromToken(String token) {
        JWTVerifier verifier = getJwtVerifier();
        return verifier.verify(token).getClaim(SecurityConstant.AUTHORITIES).asArray(String.class);
    }

    private JWTVerifier getJwtVerifier() {
        JWTVerifier verifier;
        try{
            Algorithm algorithm = Algorithm.HMAC512(this.secret.getBytes(StandardCharsets.UTF_8));
            verifier = JWT.require(algorithm).withIssuer(SecurityConstant.GRAY_TECH_FIELD_FAMILY).build();
        }catch (Exception e){
            throw new JWTVerificationException(SecurityConstant.TOKEN_CANNOT_BE_VERIFIED);
        }
        return verifier;
    }

    private String[] getClaimsFromUserPrinciple(UserPrinciple userPrinciple) {
        List<String> authorities = new ArrayList<>();
        for (GrantedAuthority grantedAuthority: userPrinciple.getAuthorities()) {
            authorities.add(grantedAuthority.getAuthority());
        }
        return authorities.toArray(new String[0]);
    }
}
