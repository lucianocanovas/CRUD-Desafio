package com.concurso.usuario.config;

import com.concurso.usuario.entity.*;
import com.concurso.usuario.repository.*;
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
    public CommandLineRunner initDatabase(UsuarioRepository usuarioRepository,
                                          PaisRepository paisRepository,
                                          DepartamentoRepository departamentoRepository,
                                          LocalidadRepository localidadRepository,
                                          DireccionRepository direccionRepository,
                                          PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Inicialización de datos geográficos (País -> Departamento -> Localidad -> Dirección)
            if (paisRepository.count() == 0) {
                log.info("Inicializando catálogo geográfico (Países, Departamentos, Localidades)...");

                Pais argentina = Pais.builder()
                        .nombre("Argentina")
                        .codigo("AR")
                        .build();
                argentina = paisRepository.save(argentina);

                Pais chile = Pais.builder()
                        .nombre("Chile")
                        .codigo("CL")
                        .build();
                paisRepository.save(chile);

                // Departamentos de Argentina
                Departamento capital = Departamento.builder()
                        .nombre("Capital")
                        .pais(argentina)
                        .build();
                capital = departamentoRepository.save(capital);

                Departamento godoyCruz = Departamento.builder()
                        .nombre("Godoy Cruz")
                        .pais(argentina)
                        .build();
                godoyCruz = departamentoRepository.save(godoyCruz);

                Departamento guaymallen = Departamento.builder()
                        .nombre("Guaymallén")
                        .pais(argentina)
                        .build();
                guaymallen = departamentoRepository.save(guaymallen);

                // Localidades
                Localidad ciudadMendoza = Localidad.builder()
                        .nombre("Ciudad de Mendoza")
                        .codigoPostal("5500")
                        .departamento(capital)
                        .build();
                ciudadMendoza = localidadRepository.save(ciudadMendoza);

                Localidad godoyCruzLoc = Localidad.builder()
                        .nombre("Godoy Cruz Centro")
                        .codigoPostal("5501")
                        .departamento(godoyCruz)
                        .build();
                localidadRepository.save(godoyCruzLoc);

                Localidad dorrego = Localidad.builder()
                        .nombre("Dorrego")
                        .codigoPostal("5519")
                        .departamento(guaymallen)
                        .build();
                localidadRepository.save(dorrego);

                // Dirección demo inicial
                Direccion direccionDemo = Direccion.builder()
                        .calle("Av. San Martín")
                        .numero("742")
                        .piso("4")
                        .nroDepartamento("B")
                        .localidad(ciudadMendoza)
                        .build();
                direccionDemo = direccionRepository.save(direccionDemo);

                log.info("Catálogo geográfico inicializado con éxito.");

                // 2. Usuario Demo (Sin roles ni administradores)
                if (usuarioRepository.count() == 0) {
                    log.info("Inicializando usuario demo...");

                    Persona personaDemo = Persona.builder()
                            .nombre("Juan")
                            .apellido("Pérez")
                            .dni("38123456")
                            .fechaNacimiento(LocalDate.of(1995, 5, 20))
                            .direccion(direccionDemo)
                            .build();

                    Usuario usuarioDemo = Usuario.builder()
                            .email("usuario@concurso.com")
                            .password(passwordEncoder.encode("usuario123"))
                            .authProvider(AuthProvider.LOCAL)
                            .activo(true)
                            .persona(personaDemo)
                            .build();

                    usuarioRepository.save(usuarioDemo);

                    log.info("Usuario demo inicializado con éxito: usuario@concurso.com / usuario123");
                }
            }
        };
    }
}
