package com.example.doit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // Add this line to fix the "cannot find symbol" error
    List<Post> findByAuthorOrderByDatePostedDesc(User author);

    // This is your existing method for the main feed
    List<Post> findAllByOrderByDatePostedDesc();
}