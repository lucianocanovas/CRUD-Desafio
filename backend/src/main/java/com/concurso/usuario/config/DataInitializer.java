package com.concurso.usuario.config;

import com.concurso.usuario.entity.AuthProvider;
import com.concurso.usuario.entity.Persona;
import com.concurso.usuario.entity.Rol;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initDatabase(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (usuarioRepository.count() == 0) {
                log.info("Inicializando datos demo para el concurso...");

                // 1. Usuario Demo
                Persona personaDemo = Persona.builder()
                        .nombre("Juan")
                        .apellido("Pérez")
                        .dni("38123456")
                        .fechaNacimiento(LocalDate.of(1995, 5, 20))
                        .direccion("Av. Siempre Viva 742")
                        .avatarId("automaton")
                        .build();

                Usuario usuarioDemo = Usuario.builder()
                        .email("usuario@concurso.com")
                        .password(passwordEncoder.encode("usuario123"))
                        .rol(Rol.ROLE_USER)
                        .authProvider(AuthProvider.LOCAL)
                        .activo(true)
                        .persona(personaDemo)
                        .build();

                usuarioRepository.save(usuarioDemo);

                // 2. Administrador Demo
                Persona personaAdmin = Persona.builder()
                        .nombre("Admin")
                        .apellido("Principal")
                        .dni("20987654")
                        .fechaNacimiento(LocalDate.of(1988, 10, 15))
                        .direccion("Calle Falsa 123")
                        .avatarId("baron")
                        .build();

                Usuario admin = Usuario.builder()
                        .email("admin@concurso.com")
                        .password(passwordEncoder.encode("admin123"))
                        .rol(Rol.ROLE_ADMIN)
                        .authProvider(AuthProvider.LOCAL)
                        .activo(true)
                        .persona(personaAdmin)
                        .build();

                usuarioRepository.save(admin);

                log.info("Datos demo inicializados con éxito.");
                log.info("Usuario: usuario@concurso.com / usuario123");
                log.info("Admin: admin@concurso.com / admin123");
            }
        };
    }
}
