module.exports = {
  openapi: "3.0.3",
  info: {
    title: "EcoBalance Ledger API",
    version: "1.0.0",
    description: "API REST para autenticação JWT, integrações OAuth 2.0, indicadores ESG, cálculo de Leontief via NumPy com fallback, ledger e notificações internas. A triagem GLOBALG.A.P. usa apenas o indicador genérico de conformidade e não constitui uma avaliação oficial."
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "ESG" },
    { name: "Leontief" },
    { name: "Ledger" },
    { name: "Notifications" },
    { name: "Users" },
    { name: "OAuth" }
  ],
  components: {
    securitySchemes: {
      UserJWT: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "JWT de usuário; a aplicação web também aceita o cookie httpOnly token." },
      OAuth2ClientCredentials: { type: "oauth2", flows: { clientCredentials: { tokenUrl: "/oauth/token", scopes: { "esg:read": "Ler o resumo ESG", "notifications:write": "Enviar notificações" } } } }
    },
    schemas: {
      Error: { type: "object", properties: { success: { type: "boolean", example: false }, message: { type: "string", example: "Não autenticado" } } },
      LoginRequest: {
        type: "object",
        required: ["email", "senha"],
        properties: { email: { type: "string", format: "email" }, senha: { type: "string", format: "password" } }
      },
      ESGIndicator: {
        type: "object",
        required: ["ano", "setor", "consumoEnergia", "consumoAgua", "emissaoCO2", "residuosEletronicosKg", "reciclagem", "diversidade", "conformidade"],
        properties: {
          ano: { type: "integer", minimum: 2000, maximum: 2100 },
          setor: { type: "string", maxLength: 120 },
          consumoEnergia: { type: "number", minimum: 0 },
          consumoAgua: { type: "number", minimum: 0 },
          emissaoCO2: { type: "number", minimum: 0 },
          residuosEletronicosKg: { type: "number", minimum: 0 },
          reciclagem: { type: "number", minimum: 0, maximum: 100 },
          diversidade: { type: "number", minimum: 0, maximum: 100 },
          conformidade: { type: "number", minimum: 0, maximum: 100, description: "Indicador genérico. Abaixo de GLOBALGAP_COMPLIANCE_THRESHOLD dispara alerta interno de triagem; não certifica conformidade GLOBALG.A.P." }
        }
      }
    }
  },
  paths: {
    "/api/v1/health": {
      get: { tags: ["Health"], summary: "Verificar disponibilidade da API", responses: { 200: { description: "Serviço disponível" } } }
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"], summary: "Autenticar e definir cookie JWT httpOnly",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
        responses: { 200: { description: "Sessão iniciada" }, 401: { description: "Credenciais inválidas", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } } }
      }
    },
    "/api/v1/auth/me": {
      get: { tags: ["Auth"], summary: "Obter usuário e permissões atuais", security: [{ UserJWT: [] }], responses: { 200: { description: "Sessão atual" }, 401: { description: "Não autenticado" } } }
    },
    "/api/v1/auth/logout": {
      post: { tags: ["Auth"], summary: "Encerrar sessão web", responses: { 200: { description: "Cookie de sessão removido" } } }
    },
    "/api/v1/esg-indicators/summary": {
      get: { tags: ["ESG"], summary: "Consultar médias anuais ESG", security: [{ UserJWT: [] }, { OAuth2ClientCredentials: ["esg:read"] }], responses: { 200: { description: "Resumo por ano" }, 401: { description: "Não autenticado" } } }
    },
    "/api/v1/esg-indicators": {
      get: { tags: ["ESG"], summary: "Listar indicadores ESG", security: [{ UserJWT: [] }], responses: { 200: { description: "Indicadores" } } },
      post: {
        tags: ["ESG"], summary: "Criar indicador ESG",
        description: "Exige permissão esg:write. Se conformidade estiver abaixo do limite configurado (padrão 80%), envia um alerta interno de triagem GLOBALG.A.P. a gerentes e auditores.",
        security: [{ UserJWT: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ESGIndicator" } } } },
        responses: { 201: { description: "Indicador registrado" }, 403: { description: "Perfil sem permissão" }, 422: { description: "Dados inválidos" } }
      }
    },
    "/api/v1/leontief/calculate": {
      post: {
        tags: ["Leontief"], summary: "Calcular produção necessária usando Leontief",
        description: "Usa o motor Python/NumPy configurado em PYTHON_API_URL quando disponível; caso contrário, usa fallback JavaScript.",
        security: [{ UserJWT: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["matrixA", "demand"], properties: { matrixA: { type: "array", items: { type: "array", items: { type: "number" } } }, demand: { type: "array", items: { type: "number" } } } } } } },
        responses: { 200: { description: "Resultado e validação Hawkins-Simons" }, 422: { description: "Matriz sem solução produtiva válida" } }
      }
    },
    "/api/v1/ledger-blocks": {
      get: { tags: ["Ledger"], summary: "Listar blocos recentes", security: [{ UserJWT: [] }], responses: { 200: { description: "Blocos do ledger" } } }
    },
    "/api/v1/ledger-blocks/verification": {
      get: { tags: ["Ledger"], summary: "Verificar integridade da cadeia", security: [{ UserJWT: [] }], responses: { 200: { description: "Resultado da verificação" }, 403: { description: "Exige permissão ledger:verify" } } }
    },
    "/api/v1/notifications": {
      get: { tags: ["Notifications"], summary: "Listar notificações do usuário atual", security: [{ UserJWT: [] }], responses: { 200: { description: "Notificações" } } },
      post: {
        tags: ["Notifications"], summary: "Enviar uma notificação",
        security: [{ UserJWT: [] }, { OAuth2ClientCredentials: ["notifications:write"] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["titulo", "mensagem"], properties: { perfil: { type: "string", example: "auditor" }, titulo: { type: "string", maxLength: 120 }, mensagem: { type: "string", maxLength: 500 }, tipo: { type: "string", enum: ["info", "sucesso", "alerta", "erro"] } } } } } },
        responses: { 201: { description: "Notificação enviada" }, 403: { description: "Sem permissão para enviar" } }
      },
      patch: { tags: ["Notifications"], summary: "Marcar as notificações atuais como lidas", security: [{ UserJWT: [] }], responses: { 200: { description: "Notificações atualizadas" } } }
    },
    "/api/v1/users": {
      get: { tags: ["Users"], summary: "Listar usuários", security: [{ UserJWT: [] }], responses: { 200: { description: "Usuários (exige users:read)" }, 403: { description: "Perfil sem permissão" } } },
      post: { tags: ["Users"], summary: "Criar usuário", security: [{ UserJWT: [] }], responses: { 201: { description: "Usuário criado" }, 403: { description: "Exige users:write" } } }
    },
    "/oauth/token": {
      post: { tags: ["OAuth"], summary: "Emitir token OAuth 2.0 client_credentials", description: "Use autenticação HTTP Basic do cliente e grant_type=client_credentials.", requestBody: { required: true, content: { "application/x-www-form-urlencoded": { schema: { type: "object", required: ["grant_type"], properties: { grant_type: { type: "string", enum: ["client_credentials"] }, scope: { type: "string" } } } } } }, responses: { 200: { description: "Token emitido" }, 401: { description: "Credenciais de cliente inválidas" } } }
    },
    "/oauth/revoke": {
      post: { tags: ["OAuth"], summary: "Revogar token OAuth", responses: { 200: { description: "Token revogado" } } }
    }
  }
};
