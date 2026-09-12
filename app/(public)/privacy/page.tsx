import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade | ZenCatalog",
  description: "Saiba como o ZenCatalog trata informações, integrações Google e conteúdos processados por inteligência artificial.",
};

// Revise este endereço antes da publicação caso o canal oficial de suporte seja outro.
const SUPPORT_EMAIL = "contato@zencatalog.gouveia.app.br";

const sectionClass = "scroll-mt-8 space-y-4";
const headingClass = "text-2xl font-black tracking-tight text-slate-950";
const paragraphClass = "text-base leading-8 text-slate-600 sm:text-lg";
const listClass = "list-disc space-y-2 pl-6 text-base leading-8 text-slate-600 sm:text-lg";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <header className="mb-10 text-center sm:mb-14">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-950/30"><ShieldCheck aria-hidden="true" size={28} /></div>
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">Política de Privacidade</h1>
        <p className="mt-4 text-base font-semibold text-blue-200">Última atualização: 12 de setembro de 2026</p>
      </header>

      <div className="space-y-10 rounded-[2.5rem] bg-white p-6 shadow-2xl shadow-black/20 sm:p-10 lg:p-12">
        <p className={paragraphClass}>
          Esta Política de Privacidade explica, em linguagem clara, como o ZenCatalog trata informações ao oferecer suas funcionalidades. O tratamento realizado depende dos recursos que você decide utilizar.
        </p>

        <section className={sectionClass}>
          <h2 className={headingClass}>1. Sobre o ZenCatalog</h2>
          <p className={paragraphClass}>O ZenCatalog é uma aplicação para organização, catalogação, consulta e processamento inteligente de vídeos, documentos e outros conteúdos digitais.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>2. Informações processadas</h2>
          <p className={paragraphClass}>Conforme as funcionalidades utilizadas, podemos processar:</p>
          <ul className={listClass}>
            <li>informações básicas de conta, como nome, endereço de e-mail e identificadores necessários à autenticação;</li>
            <li>arquivos enviados ou disponibilizados para uma operação solicitada;</li>
            <li>nomes, identificadores, tipos e outros metadados de arquivos;</li>
            <li>descrições, observações e dados necessários à catalogação;</li>
            <li>conteúdo fornecido para análise e geração de informações por inteligência artificial.</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>3. Google Drive e Google APIs</h2>
          <p className={paragraphClass}>Quando você escolhe entrar com uma conta Google ou autoriza uma integração Google, o ZenCatalog recebe apenas os dados e permissões apresentados no fluxo de autorização. Dependendo da automação solicitada, o ZenCatalog e as automações que apoiam seu funcionamento podem localizar arquivos, obter informações sobre eles, processar arquivos autorizados e organizar ou renomear arquivos quando isso fizer parte da funcionalidade escolhida.</p>
          <p className={paragraphClass}>Dados obtidos por meio das APIs Google são utilizados somente para fornecer ou melhorar funcionalidades solicitadas por você. Eles não são usados para publicidade, criação de perfil publicitário, venda de dados ou treinamento de modelos próprios do ZenCatalog.</p>
          <p className={paragraphClass}>O acesso é limitado à finalidade da funcionalidade autorizada e às permissões concedidas. Autorizar a integração não significa conceder acesso irrestrito à conta Google.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>4. Uso de inteligência artificial</h2>
          <p className={paragraphClass}>O ZenCatalog utiliza serviços Google Gemini para determinadas tarefas de análise, catalogação e geração de embeddings. Quando uma funcionalidade de inteligência artificial é utilizada, o arquivo, texto, descrição ou metadado necessário para aquela operação pode ser enviado ao provedor para processamento. Esse processamento pode gerar categorias, nomes sugeridos, resumos e outras informações de catalogação.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>5. Como utilizamos as informações</h2>
          <ul className={listClass}>
            <li>autenticar usuários e fornecer as funcionalidades do ZenCatalog;</li>
            <li>processar, catalogar e organizar conteúdos;</li>
            <li>gerar metadados, resumos, nomes sugeridos e representações para pesquisa;</li>
            <li>permitir consultas e pesquisas no acervo;</li>
            <li>manter a segurança, a integridade e o funcionamento da aplicação.</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>6. Armazenamento</h2>
          <p className={paragraphClass}>O ZenCatalog utiliza banco de dados para armazenar informações necessárias ao funcionamento da aplicação, como dados de conta e de catalogação. O conteúdo e o tempo de armazenamento podem variar conforme a funcionalidade utilizada e as necessidades operacionais do serviço.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>7. Compartilhamento e prestadores de serviço</h2>
          <p className={paragraphClass}>Informações podem ser transmitidas aos prestadores estritamente necessários para executar uma funcionalidade solicitada, como provedores de inteligência artificial, autenticação, armazenamento e APIs integradas. O ZenCatalog não vende dados pessoais nem compartilha dados para fins comerciais ou publicitários.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>8. Segurança</h2>
          <p className={paragraphClass}>Adotamos medidas técnicas e organizacionais razoáveis para proteger as informações contra acesso, alteração, divulgação ou destruição não autorizados. Nenhum sistema conectado à internet, entretanto, pode oferecer segurança absoluta.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>9. Revogação do acesso Google</h2>
          <p className={paragraphClass}>Você pode revisar ou revogar o acesso concedido ao ZenCatalog a qualquer momento nas configurações de segurança da sua conta Google. A revogação impede novas operações que dependam dessa autorização, mas não elimina automaticamente informações já armazenadas pelo ZenCatalog quando elas forem necessárias a outros recursos da sua conta.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>10. Seus direitos</h2>
          <p className={paragraphClass}>Você pode solicitar informações sobre o tratamento dos seus dados e, quando aplicável, sua correção ou exclusão. Algumas informações podem precisar ser mantidas quando houver uma razão legítima ou obrigação aplicável. Cada solicitação será analisada conforme o contexto e a legislação aplicável.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>11. Alterações desta política</h2>
          <p className={paragraphClass}>Esta política pode ser atualizada para refletir mudanças no ZenCatalog ou em seus processos. A data exibida no início do documento indica a revisão mais recente.</p>
        </section>

        <section className={sectionClass}>
          <h2 className={headingClass}>12. Contato</h2>
          <p className={paragraphClass}>Para dúvidas ou solicitações relacionadas à privacidade, escreva para <a className="font-bold text-blue-700 underline decoration-blue-300 underline-offset-4 outline-none hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
          <p className="text-sm leading-6 text-slate-500">Consulte também os <Link className="font-bold text-blue-700 underline underline-offset-4 outline-none hover:text-blue-900 focus-visible:ring-2 focus-visible:ring-blue-500" href="/terms">Termos de Serviço</Link>.</p>
        </section>
      </div>
    </article>
  );
}
