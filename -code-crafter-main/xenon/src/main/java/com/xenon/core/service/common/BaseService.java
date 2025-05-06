package com.xenon.core.service.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xenon.core.domain.exception.AuthException;
import com.xenon.core.domain.exception.ClientException;
import com.xenon.core.domain.model.ResponseMessage;
import com.xenon.core.domain.response.BaseResponse;
import com.xenon.data.entity.user.User;
import com.xenon.data.repository.UpazilaRepository;
import com.xenon.data.repository.UserRepository;
import com.xenon.presenter.config.ApplicationConfig;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import java.util.Objects;
import java.util.regex.Pattern;
@Setter
public abstract class BaseService {

    private static final Logger log = LoggerFactory.getLogger(BaseService.class);
    protected UserRepository userRepository;
    protected UpazilaRepository upazilaRepository;
    protected HttpServletRequest request;
    protected ObjectMapper objectMapper;

    @Autowired
    private void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    private void setUpazilaRepository(UpazilaRepository upazilaRepository) {
        this.upazilaRepository = upazilaRepository;
    }

    @Autowired
    private void setRequest(HttpServletRequest request) {
        this.request = request;
    }

    @Autowired
    private void setObjectMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    protected static final Pattern PHONE_PATTERN = Pattern.compile("^01[3-9]\\d{8}$");
    protected static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    protected User getCurrentUser() {
        String userJson = (String) request.getAttribute(ApplicationConfig.USER_REQUEST_ATTRIBUTE_KEY);
        if (Objects.isNull(userJson)) throw new AuthException(ResponseMessage.AUTH_HEADER_MISSING);

        try {
            return objectMapper.readValue(userJson, User.class);
        } catch (JsonProcessingException e) {
            log.error(e.getMessage(), e);
            throw new AuthException(ResponseMessage.SESSION_DATA_MISMATCH);
        }
    }

    public  boolean isValidNumber(String number) {
        if (number == null || number.isEmpty()) return false;
        if (number.charAt(0) == '-' || number.charAt(0) == '+') number = number.substring(1);

        char[] numbers = number.toCharArray();
        boolean hasDecimal = false;

        for (char c : numbers) {
            if (c == '.') {
                if (hasDecimal) return false;
                hasDecimal = true;
                continue;
            }
            if (c < '0' || c > '9') return false;
        }

        return !hasDecimal || number.indexOf('.') != number.length() - 1;
    }

    protected String getCurrentUserPhone() {
        return getCurrentUser().getPhone();
    }


    protected String getCurrentUserEmail() {
        return getCurrentUser().getEmail();
    }

    protected <T> void validateBody(T body) {
        if (body == null) throw clientException("Body is required");
    }

    protected ClientException clientException(String message) {
        return new ClientException(message);
    }

    protected ClientException requiredField(String fieldName) {
        return new ClientException(fieldName + " is required");
    }

    protected boolean isNullOrBlank(String field) {
        return field == null || field.isBlank();
    }

    protected <T> ResponseEntity<BaseResponse<T>> success(String message, T data) {
        return new ResponseEntity<>(
                new BaseResponse<>(
                        ResponseMessage.OPERATION_SUCCESSFUL.getCode(),
                        Objects.isNull(message) ? ResponseMessage.OPERATION_SUCCESSFUL.getMessage() : message,
                        data
                ),
                ResponseMessage.OPERATION_SUCCESSFUL.getStatus()
        );
    }
}
