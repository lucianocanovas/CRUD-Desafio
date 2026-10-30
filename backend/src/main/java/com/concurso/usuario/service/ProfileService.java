package com.concurso.usuario.service;

import com.concurso.usuario.dto.request.ChangePasswordRequest;
import com.concurso.usuario.dto.request.ProfileUpdateRequest;
import com.concurso.usuario.dto.response.ProfileResponse;
import com.concurso.usuario.entity.Usuario;

import java.util.List;

public interface ProfileService {
    ProfileResponse getProfileByEmail(String email);
    ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    void deleteAccount(Long userId);
    List<ProfileResponse> getAllProfiles();
    void deleteUserById(Long id);
    Usuario findByEmail(String email);
}
