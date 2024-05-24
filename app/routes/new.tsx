import { getAuth } from "@clerk/remix/ssr.server";
import { ActionFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { Form, Link, useActionData } from "@remix-run/react";
import { css } from "styled-system/css";
import { getGraphqlClient } from "~/graphql-client";
import { getFormProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import * as v from "valibot";
import { ChevronLeftIcon } from "lucide-react";
import { Input } from "~/components/inputs/input";
import { Textarea } from "~/components/inputs/textarea";
import { Select } from "~/components/inputs/select";

const formSchema = v.object({
  title: v.string("Title is required"),
  language: v.picklist(["javascript"], "Invalid language"),
  code: v.string("Content is required"),
});

export async function action(args: ActionFunctionArgs) {
  const { request, context } = args;

  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/");
  }

  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: formSchema,
  });

  if (submission.status !== "success") {
    return json({
      success: false,
      message: "Validation failed",
      submission: submission.reply(),
    });
  }

  const client = getGraphqlClient(context.cloudflare.env.API_URL);

  try {
    await client.CreateSnippet({
      userId: userId,
      title: formData.get("title")!.toString(),
      language: formData.get("language")!.toString(),
      code: formData.get("code")!.toString(),
    });
  } catch (error) {
    return json({
      success: false,
      message: "Failed to create snippet",
      submission: submission.reply(),
    });
  }

  return redirect("/");
}

export default function New() {
  const formData = useActionData<typeof action>();

  const [form, { title, language, code }] = useForm({
    lastResult: formData?.submission,
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema: formSchema,
      });
    },
  });

  return (
    <div
      className={css({
        background: "gray.50",
        minHeight: "100vh",
      })}
    >
      <div
        className={css({
          maxWidth: "36rem",
          marginX: "auto",
          padding: "1rem",
        })}
      >
        <Link
          to="/"
          className={css({
            color: "gray.600",
            fontSize: "sm",
            fontWeight: "semibold",
            display: "flex",
            alignItems: "center",
            "&:hover": {
              color: "gray.800",
            },
          })}
        >
          <ChevronLeftIcon size={16} />
          Go Back
        </Link>
        <Form
          method="post"
          {...getFormProps(form)}
          className={css({
            marginTop: "1rem",
          })}
        >
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            })}
          >
            <Input label="Title" name="title" errors={title.errors} />
            <Select
              name="language"
              label="Language"
              options={[
                {
                  value: "javascript",
                  label: "JavaScript",
                },
              ]}
              errors={language.errors}
            />
            <Textarea name="code" label="Code" errors={code.errors} rows={10} />
          </div>
          <button
            type="submit"
            className={css({
              marginTop: "1rem",
              paddingX: "0.75rem",
              width: "100%",
              height: "2.125rem",
              borderRadius: "md",
              backgroundColor: { base: "black", _hover: "gray.800" },
              color: "white",
              fontSize: "sm",
              lineHeight: 1,
              fontWeight: "semibold",
              cursor: "pointer",
            })}
          >
            Create
          </button>
        </Form>
      </div>
    </div>
  );
}
