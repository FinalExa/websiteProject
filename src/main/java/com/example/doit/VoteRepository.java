package com.example.doit;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByPostAndUserUsername(Post post, String username);

    Optional<Vote> findByPostAndUser(Post post, User user);

    long countByPostAndType(Post post, String type);
}