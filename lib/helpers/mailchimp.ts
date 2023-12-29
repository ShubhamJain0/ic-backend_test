import MailChimp from "@mailchimp/mailchimp_transactional";

const mailchimp = MailChimp(process.env.MAILCHIMP_API_KEY!);

interface IMailChimp {
  subject: string;
  text: string;
  to_email: string;
  from_email?: string;
}

interface IMailChimpTemplate {
  subject: string;
  text?: string;
  to_email: string;
  template_name: string;
  template_content: Array<{
    name: string;
    content: string;
  }>;
  from_email?: string;
}

export const sendEmail = async (data: IMailChimp) => {
  try {
    const message: any = {
      from_email: data.from_email || "shubham@thethunderclap.com",
      subject: data.subject,
      text: data.text,
      to: [
        {
          email: data.to_email,
          type: "to",
        },
      ],
    };
    await mailchimp.messages.send({ message });
  } catch (e) {
    throw new Error(`Failed to send mail : ${e}`);
  }
};

export const sendEmailUsingTemplate = async (data: IMailChimpTemplate) => {
  try {
    const message: any = {
      from_email: data.from_email || "shubham@thethunderclap.com",
      subject: data.subject,
      text: data.text,
      to: [
        {
          email: data.to_email,
          type: "to",
        },
      ],
    };
    let resp = await mailchimp.messages.sendTemplate({
      message,
      template_name: data.template_name,
      template_content: data.template_content,
    });
    console.log("MailChimp", resp);
  } catch (e) {
    throw new Error(`Failed to send mail : ${e}`);
  }
};
