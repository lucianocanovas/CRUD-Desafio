package com.concurso.usuario.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Datos para el cambio seguro de contraseña (Opción 2, compatible con cuentas locales y Google/OAuth)")
public class ChangePasswordRequest {

    @Schema(description = "Contraseña actual (obligatoria para cuentas locales; opcional si inició sesión con Google/Auth0)", example = "usuario123")
    private String currentPassword;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 6, message = "La nueva contraseña debe tener al menos 6 caracteres")
    @Schema(description = "Nueva contraseña deseada (mínimo 6 caracteres)", example = "NuevaClave456")
    private String newPassword;

    @NotBlank(message = "La confirmación de la contraseña es obligatoria")
    @Schema(description = "Confirmación idéntica de la nueva contraseña", example = "NuevaClave456")
    private String confirmPassword;

    public ChangePasswordRequest() {
    }

    public ChangePasswordRequest(String currentPassword, String newPassword, String confirmPassword) {
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
        this.confirmPassword = confirmPassword;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }
}
