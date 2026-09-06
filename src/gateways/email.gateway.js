export class EmailGateway {
  async enviar({ para, assunto, corpo }) {
    console.log(`[SMTP] Enviando email para ${para}: [${assunto}] ${corpo}`);
  }
}
