import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { styled } from "nativewind";

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

const buttonVariants = cva(
    "flex-row items-center justify-center rounded-md",
    {
        variants: {
            variant: {
                default: "bg-indigo-600",
                destructive: "bg-red-500",
                outline: "border border-gray-200 bg-white",
                secondary: "bg-gray-100",
                ghost: "bg-transparent",
                link: "text-indigo-600 underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const buttonTextVariants = cva(
    "text-sm font-medium",
    {
        variants: {
            variant: {
                default: "text-white",
                destructive: "text-white",
                outline: "text-gray-900",
                secondary: "text-gray-900",
                ghost: "text-gray-900",
                link: "text-indigo-600",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const Button = ({ className, variant, size, children, ...props }) => {
    const childArray = React.Children.toArray(children);
    const hasOnlyTextNodes = childArray.length > 0 && childArray.every((child) => typeof child === "string" || typeof child === "number");
    const textContent = hasOnlyTextNodes ? childArray.join("") : null;

    return (
        <StyledTouchableOpacity
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        >
            {hasOnlyTextNodes ? (
                <StyledText className={buttonTextVariants({ variant })}>
                    {textContent}
                </StyledText>
            ) : (
                childArray
            )}
        </StyledTouchableOpacity>
    );
};

export { Button, buttonVariants };
