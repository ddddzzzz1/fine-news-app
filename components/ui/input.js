import { TextInput } from "react-native";
import { cn } from "../../lib/utils";
import { styled } from "nativewind";

const StyledTextInput = styled(TextInput);

const Input = ({ className, ...props }) => {
    return (
        <StyledTextInput
            className={cn(
                "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-600",
                className
            )}
            {...props}
        />
    );
};

export { Input };
