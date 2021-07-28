import { createTransport, createTestAccount, Transporter, TransportOptions } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

export const createTransporter = async (host: string, port: number, user: string, pass: string) => Promise.resolve(createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass }
}))

export const createTestingTransporter = async () => {
    const testAccount = await createTestAccount()
    return createTransport({
        ...testAccount.smtp,
        auth: { user: testAccount.user, pass: testAccount.pass }
    })
}

export const emailTemplate = (user: string, text: string) => (to: string) => ({
    from: `"Email Verifier" <${user}>`,
    to,
    subject: 'VC Email Verification',
    text,
    html: `<p>${text}</p>`,
})

export class EmailSender {
    mail: Mail

    constructor(transporter: Mail) {
        this.mail = transporter
    }

    sendMail = (to: string, text: string) => this.mail.sendMail({
        from: `"Email Verifier" <${this.mail.options.from}>`,
        to,
        subject: 'VC Email Verification',
        text,
        html: `<p>${text}</p>`,
    })

    static createTransporter = async (host: string, port: number, user: string, pass: string) => {
        const transporter = createTransport({
            host,
            port,
            secure: true,
            auth: { user, pass }
        })

        return Promise.resolve(new EmailSender(transporter))
    }

    static createTestingTransporter = async () => {
        const testAccount = await createTestAccount()
        const transporter = createTransport({
            ...testAccount.smtp,
            auth: { user: testAccount.user, pass: testAccount.pass }
        })
        return new EmailSender(transporter)
    } 
}
