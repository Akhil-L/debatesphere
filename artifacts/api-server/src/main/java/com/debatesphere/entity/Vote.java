package com.debatesphere.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "votes",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "argument_id"}),
        @UniqueConstraint(columnNames = {"ip_address", "argument_id"})
    })
@Getter
@Setter
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(name = "argument_id", nullable = false)
    private Long argumentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "argument_id", insertable = false, updatable = false)
    private Argument argument;

    @Column(nullable = false)
    private String vote;

    @Column(name = "ip_address")
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}