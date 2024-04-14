import { json, type MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { css } from "styled-system/css";
import { Header } from "~/components/header";
import { getPosts, Post } from "~/models/post.server";
import hljs from "highlight.js";
import { Card } from "~/components/card";
import { generateGridTemplateAreas } from "~/utils/grid";
import { Container } from "~/components/container";

export const meta: MetaFunction = () => {
  return [
    { title: "Codebases Snippet" },
    {
      name: "description",
      content: "Welcome to Codebases Snippet! Here you can find code snippets.",
    },
  ];
};

function generateCardStyleHtml(posts: Post[]) {
  return `
    <style>
      .card-list {
        display: grid;
        grid-template-areas: ${generateGridTemplateAreas(posts, 4)};
        grid-template-columns: repeat(4, 28rem);
      }
      
      .card-list > li {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        padding-bottom: 1rem;
      }
      
      @media (max-width: calc(28rem * 4 + 1rem)) {
        .card-list {
          grid-template-areas: ${generateGridTemplateAreas(posts, 3)};
          grid-template-columns: repeat(3, 28rem);
        }
      }
      
      @media (max-width: calc(28rem * 3 + 1rem)) {
        .card-list {
          grid-template-areas: ${generateGridTemplateAreas(posts, 2)};
          grid-template-columns: repeat(2, 28rem);
        }
      }
      
      @media (max-width: calc(28rem * 2 + 1rem)) {
        .card-list {
          display: block;
          width: 100%;
          grid-template-areas: ${generateGridTemplateAreas(posts, 1)};
          grid-template-columns: 1fr;
        }
        
        .card-list > li {
          padding-left: 0;
          padding-right: 0;
        }
      }
    </style>
  `;
}

export async function loader() {
  const posts = await getPosts();
  const transformedPosts = posts.map((post) => ({
    ...post,
    codeHtml: hljs.highlight(post.code, { language: post.language }).value,
  }));

  return json({
    posts: transformedPosts,
    cardStyleHtml: generateCardStyleHtml(transformedPosts),
  });
}

export default function Index() {
  const { posts, cardStyleHtml } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <Header />
      <Container>
        <div dangerouslySetInnerHTML={{ __html: cardStyleHtml }} />
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: "1rem",
            lineHeight: 2,
            gap: "1rem",
          })}
        >
          <ul className="card-list">
            {posts.map((post) => (
              <li
                key={post.id}
                style={{
                  gridArea: `item${post.id}`,
                }}
              >
                <Card post={post} />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </div>
  );
}
