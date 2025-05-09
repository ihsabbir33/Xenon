package com.xenon.data.entity.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xenon.core.domain.response.user.UserResponse;
import com.xenon.data.entity.location.Upazila;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.SneakyThrows;

import java.time.ZonedDateTime;

@Entity
@Table(name = "TABLE_USER")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String firstName;

    @Column
    private String lastName;

    @Column
    private String phone;

    @Column
    private String email;

    @Column
    private String password;

    @Enumerated(EnumType.STRING)
    @Column
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column
    private AccountStatus status = AccountStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "UPAZILA_ID")
    private Upazila upazila;

    private String area;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column
    private Gender gender;

    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

    public User(String phone, String password, UserRole role) {
        this.phone = phone;
        this.password = password;
        this.role = role;
    }

    public UserResponse toResponse() {
        return new UserResponse(this.id, this.firstName, this.lastName, this.phone, this.email, this.role, this.status, this.upazila, this.area, this.latitude, this.longitude, this.gender);
    }

    @SneakyThrows
    public String toString(ObjectMapper objectMapper) {
        return objectMapper.writeValueAsString(this);
    }
}
