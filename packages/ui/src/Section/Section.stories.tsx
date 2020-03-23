import React from "react";
import { storiesOf } from "@storybook/react";
import {
    Story,
    StoryReadme,
    StorySandboxCode,
    StorySandbox,
    StorySandboxExample
} from "@webiny/storybook-utils/Story";
import readme from "./README.md";

import Section from "./index";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

const story = storiesOf("Components/Section", module);

const StatBox = styled("div")({
    width: "33.33%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    color: "var(--mdc-theme-on-surface)"
});

const ContentWrapper = styled("div")({
    flexDirection: "row",
    display: "flex",
    width: "100%",
    boxSizing: "border-box"
});

const RenderSection = styled("div")({
    backgroundColor: "var(--mdc-theme-background)",
    padding: "1px 25px 0 25px"
});

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox>
                    <StorySandboxExample>
                        <RenderSection>
                            <Section title="Section 1">Here goes the first section</Section>
                            <Section title="Section 2">And this is the second section 🦄</Section>
                        </RenderSection>
                    </StorySandboxExample>
                    <StorySandboxCode>
                        {`
                        import styled from "@emotion/styled";
                        
                        const RenderSection = styled("div")({
                            backgroundColor: "var(--mdc-theme-background)",
                            padding: "1px 25px 0 25px"
                        });

                         <RenderSection>
                            <Section title="Section 1">Here goes the first section</Section>
                            <Section title="Section 2">And this is the second section 🦄</Section>
                        </RenderSection>
                    `}
                    </StorySandboxCode>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Section] } }
);
