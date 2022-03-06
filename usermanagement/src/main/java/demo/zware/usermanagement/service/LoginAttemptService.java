package demo.zware.usermanagement.service;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Service
public class LoginAttemptService {
    private static final int MAXIMUM_NUMBER_OF_ATTEMPT = 5;
    private static final int ATTEMPT_INCREMENT = 1;
    private LoadingCache<String, Integer> loginAttemptCache;

    public LoginAttemptService() {
        super();
        this.loginAttemptCache = CacheBuilder.newBuilder().expireAfterWrite(3, TimeUnit.MINUTES)
                .maximumSize(100).build(new CacheLoader<String, Integer>() {
                    @Override
                    public Integer load(String s) throws Exception {
                        return 0;
                    }
                });
    }

    public void evictUserFromLoginAttemptCache(String username){
        this.loginAttemptCache.invalidate(username);
    }

    public void addUserToLoginAttemptCache(String username) throws ExecutionException {
        int attempts = this.loginAttemptCache.get(username) + ATTEMPT_INCREMENT;
        loginAttemptCache.put(username, attempts);
    }

    public boolean hasExceededMaxAttempts(String username) throws ExecutionException {
        return this.loginAttemptCache.get(username) >= MAXIMUM_NUMBER_OF_ATTEMPT;
    }


}
