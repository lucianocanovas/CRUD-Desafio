package com.concurso.usuario.dto.request;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;

public class DireccionRequestDeserializer extends JsonDeserializer<DireccionRequest> {

    @Override
    public DireccionRequest deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        if (node.isTextual()) {
            String text = node.asText();
            return new DireccionRequest(text, "S/N", null, null, null);
        }
        if (node.isObject()) {
            String calle = node.has("calle") && !node.get("calle").isNull() ? node.get("calle").asText() : null;
            String numero = node.has("numero") && !node.get("numero").isNull() ? node.get("numero").asText() : "S/N";
            String piso = node.has("piso") && !node.get("piso").isNull() ? node.get("piso").asText() : null;
            String depto = node.has("departamento") && !node.get("departamento").isNull() ? node.get("departamento").asText() : null;
            Long localidadId = node.has("localidadId") && !node.get("localidadId").isNull() ? node.get("localidadId").asLong() : null;
            return new DireccionRequest(calle, numero, piso, depto, localidadId);
        }
        return null;
    }
}
