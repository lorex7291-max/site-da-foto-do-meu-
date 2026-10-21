# Entre Nós — foto por QR Code

Um site responsivo em português: a pessoa compartilha um QR Code e, ao escaneá-lo, o celular abre uma página especial com a foto e uma mensagem.

## Como usar

1. Rode `npm install` e `npm run dev`.
2. No painel inicial, cole o **link público HTTPS de uma imagem** (ex.: uma foto publicada em um serviço que permita exibição direta).
3. Opcionalmente personalize o título e a dedicatória. Clique em **Gerar meu QR Code**.
4. Baixe o QR Code em PNG ou copie o link. Quem escanear verá a foto.

**Importante:** a imagem precisa estar hospedada publicamente e seu link deve apontar para uma imagem visível sem login. O site não faz upload de fotos nem armazena imagens; isso permite que a experiência funcione como site estático, sem banco de dados. O link da imagem, título e mensagem fazem parte do link embutido no QR Code. Qualquer pessoa que possuir esse QR Code poderá abrir a imagem.

## Scripts

- `npm run dev` — servidor local
- `npm run build` — typecheck e build para produção
- `npm run preview` — pré-visualização local da versão compilada

Implementado com React, TypeScript, Vite, lucide-react e qrcode.react.
