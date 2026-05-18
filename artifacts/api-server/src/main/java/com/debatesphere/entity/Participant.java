package com.debatesphere.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "participants",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "debate_id"}))
@Getter
@Setter
public class Participant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(name = "debate_id", nullable = false)
    private Long debateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debate_id", insertable = false, updatable = false)
    private Debate debate;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;
}
