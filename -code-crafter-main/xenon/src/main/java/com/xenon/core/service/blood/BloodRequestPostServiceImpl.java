package com.xenon.core.service.blood;

import com.xenon.core.domain.exception.ApiException;
import com.xenon.core.domain.exception.ClientException;
import com.xenon.core.domain.request.blood.CreateBloodRequestPost;
import com.xenon.core.domain.response.PageResponseRequest;
import com.xenon.core.domain.response.blood.BloodDashBoardResponse;
import com.xenon.core.domain.response.blood.BloodRequestPostCommentResponse;
import com.xenon.core.domain.response.blood.BloodRequestPostDisplayResponse;
import com.xenon.core.domain.response.blood.BloodRequestPostResponse;
import com.xenon.core.domain.response.blood.projection.BloodMetaDataProjection;
import com.xenon.core.service.common.BaseService;
import com.xenon.data.entity.blood.BloodCommentTable;
import com.xenon.data.entity.blood.BloodRequestPost;
import com.xenon.data.entity.donor.BloodType;
import com.xenon.data.entity.location.Upazila;
import com.xenon.data.repository.BloodCommentRepository;
import com.xenon.data.repository.BloodRequestPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class BloodRequestPostServiceImpl extends BaseService implements BloodRequestPostService {

    private final BloodRequestPostRepository bloodRequestPostRepository;
    private final BloodCommentRepository bloodCommentRepository;

    @Override
    public ResponseEntity<?> createBloodRequestPost(CreateBloodRequestPost body) {
        hasUpdate();

        validateCreateBloodRequestPost(body);
        Upazila upazila = upazilaRepository.findById(body.getUpazilaId()).orElseThrow(() -> new ClientException("No upazila Found"));

        try {
            bloodRequestPostRepository.save(body.toEntity(getCurrentUser(), upazila));
            return success("Request created successfully", null);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new ApiException(e);
        }
    }

    @Override
    public ResponseEntity<?> getBloodDashboard() {
        BloodMetaDataProjection bloodMetaDataProjection = bloodRequestPostRepository.getBloodMetadata();

        List<BloodRequestPost> recentPosts = bloodRequestPostRepository.findRecentPosts(5);

        return success("Dashboard retrieved successfully",
                new BloodDashBoardResponse(
                        bloodMetaDataProjection.getTotalDonor(),
                        bloodMetaDataProjection.getTotalDonation(),
                        bloodMetaDataProjection.getTotalPost(),
                        recentPosts.stream().map(item -> item.toResponse(null)).toList()
                ));
    }

    @Override
    public ResponseEntity<?> getBloodRequestPostPage(Pageable pageable) {
        try {
            Page<BloodRequestPost> postsPage = bloodRequestPostRepository.findAllByOrderByDateDesc(pageable);
            List<Long> postIds = postsPage.getContent().stream()
                    .map(BloodRequestPost::getId)
                    .collect(Collectors.toList());

            List<BloodCommentTable> comments = bloodCommentRepository.findByBloodRequestPostIdIn(postIds);

            List<BloodRequestPostResponse> responses = postsPage.getContent().stream()
                    .map(post -> post.toResponse(getPostComments(comments, post.getId())))
                    .collect(Collectors.toList());

            PageResponseRequest<BloodRequestPostResponse> pageResponse = new PageResponseRequest<>(
                    responses,
                    postsPage.getNumber(),
                    postsPage.getSize(),
                    postsPage.getTotalElements(),
                    postsPage.getTotalPages()
            );

            return success("Blood request posts retrieved successfully", pageResponse);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new ApiException(e);
        }
    }

    @Override
    public ResponseEntity<?> getBloodPostPage(Pageable pageable) {
        try {
            Page<BloodRequestPost> postsPage = bloodRequestPostRepository.findAllByUser_Id(
                    getCurrentUser().getId(), pageable);

            List<Long> postIds = postsPage.getContent().stream()
                    .map(BloodRequestPost::getId)
                    .collect(Collectors.toList());

            List<BloodCommentTable> comments = bloodCommentRepository.findByBloodRequestPostIdIn(postIds);

            List<BloodRequestPostResponse> responses = postsPage.getContent().stream()
                    .map(post -> post.toResponse(getPostComments(comments, post.getId())))
                    .collect(Collectors.toList());

            PageResponseRequest<BloodRequestPostResponse> pageResponse = new PageResponseRequest<>(
                    responses,
                    postsPage.getNumber(),
                    postsPage.getSize(),
                    postsPage.getTotalElements(),
                    postsPage.getTotalPages()
            );

            return success("User blood request posts retrieved successfully", pageResponse);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new ApiException(e);
        }
    }

    @Override
    public ResponseEntity<?> getBloodRequestsByType(BloodType bloodType, Pageable pageable) {
        try {
            Page<BloodRequestPost> postsPage = bloodRequestPostRepository.findAllByBloodType(bloodType, pageable);

            PageResponseRequest<BloodRequestPostResponse> pageResponse = createPostsPageResponse(postsPage);

            return success("Blood requests by type retrieved successfully", pageResponse);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new ApiException(e);
        }
    }

    @Override
    public ResponseEntity<?> getBloodRequestsByLocation(Long upazilaId, Pageable pageable) {
        try {
            Page<BloodRequestPost> postsPage = bloodRequestPostRepository.findAllByUpazila_Id(upazilaId, pageable);

            PageResponseRequest<BloodRequestPostResponse> pageResponse = createPostsPageResponse(postsPage);

            return success("Blood requests by location retrieved successfully", pageResponse);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new ApiException(e);
        }
    }

    @Override
    public ResponseEntity<?> getBloodRequestsByTypeAndLocation(BloodType bloodType, Long upazilaId, Pageable pageable) {
        try {
            Page<BloodRequestPost> postsPage = bloodRequestPostRepository
                    .findAllByBloodTypeAndUpazila_Id(bloodType, upazilaId, pageable);

            PageResponseRequest<BloodRequestPostResponse> pageResponse = createPostsPageResponse(postsPage);

            return success("Blood requests by type and location retrieved successfully", pageResponse);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new ApiException(e);
        }
    }

    @Override
    public ResponseEntity<?> getBloodRequestDetails(Long requestId) {
        try {
            BloodRequestPost post = bloodRequestPostRepository.findById(requestId)
                    .orElseThrow(() -> new ClientException("Blood request not found"));

            List<BloodCommentTable> comments = bloodCommentRepository.findByBloodRequestPostId(requestId);

            List<BloodRequestPostCommentResponse> commentResponses = comments.stream()
                    .map(comment -> new BloodRequestPostCommentResponse(
                            comment.getUser().getFirstName(),
                            comment.getUser().getLastName(),
                            comment.getComment()
                    )).collect(Collectors.toList());

            return success("Blood request details retrieved successfully",
                    post.toResponse(commentResponses));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            throw new ApiException(e);
        }
    }

    private PageResponseRequest<BloodRequestPostResponse> createPostsPageResponse(Page<BloodRequestPost> postsPage) {
        List<Long> postIds = postsPage.getContent().stream()
                .map(BloodRequestPost::getId)
                .collect(Collectors.toList());

        List<BloodCommentTable> comments = bloodCommentRepository.findByBloodRequestPostIdIn(postIds);

        List<BloodRequestPostResponse> responses = postsPage.getContent().stream()
                .map(post -> post.toResponse(getPostComments(comments, post.getId())))
                .collect(Collectors.toList());

        return new PageResponseRequest<>(
                responses,
                postsPage.getNumber(),
                postsPage.getSize(),
                postsPage.getTotalElements(),
                postsPage.getTotalPages()
        );
    }

    private List<BloodRequestPostCommentResponse> getPostComments(
            List<BloodCommentTable> allComments, Long postId) {
        return allComments.stream()
                .filter(comment -> comment.getBloodRequestPost().getId().equals(postId))
                .map(comment -> new BloodRequestPostCommentResponse(
                        comment.getUser().getFirstName(),
                        comment.getUser().getLastName(),
                        comment.getComment()
                ))
                .collect(Collectors.toList());
    }

    private void validateCreateBloodRequestPost(CreateBloodRequestPost body) {
        super.validateBody(body);

        if (isNullOrBlank(body.getPatientName())) throw requiredField("Patient Name");
        if (body.getBloodType() == null) throw requiredField("Blood Type");
        if (body.getQuantity() == null) throw requiredField("Quantity");
        if (isNullOrBlank(body.getHospitalName())) throw requiredField("Hospital Name");
        if (isNullOrBlank(body.getContactNumber())) throw requiredField("Contact Number");
        if (isNullOrBlank(body.getDescription())) throw requiredField("Description");

        if (!isValidNumber(body.getQuantity().toString())) throw clientException("Use only number for quantity");
        if (!PHONE_PATTERN.matcher(body.getContactNumber()).matches()) throw clientException("Invalid phone number");
        if (body.getDate() == null) throw requiredField("Date");

    }

    private BloodRequestPostDisplayResponse getBloodRequestPostDisplayResponse(List<BloodRequestPost> posts, List<BloodCommentTable> comments) {
        List<BloodRequestPostResponse> bloodRequestPostResponseList = posts
                .stream()
                .map(item -> item.toResponse(comments.stream()
                        .filter(comment -> comment.getBloodRequestPost().getId().equals(item.getId()))
                        .map(comment2 -> new BloodRequestPostCommentResponse(
                                comment2.getUser().getFirstName(),
                                comment2.getUser().getLastName(),
                                comment2.getComment()
                        )).toList())).toList();
        return new BloodRequestPostDisplayResponse(
                comments.size(),
                bloodRequestPostResponseList
        );
    }
}

