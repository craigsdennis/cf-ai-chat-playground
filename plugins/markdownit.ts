import md from "markdown-it";
import markdownItHighlightjs from 'markdown-it-highlightjs';


export default defineNuxtPlugin(() => {
  const renderer = md();
  renderer.use(markdownItHighlightjs);
  return {
    provide: {
      mdRenderer: renderer,
    },
  };
});