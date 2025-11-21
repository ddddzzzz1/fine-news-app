import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { styled } from "nativewind";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react-native";
import { Button } from "../components/ui/button";

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);

const HELP_SECTIONS = [
    {
        title: "계정 & 로그인",
        description: "이메일 인증과 비밀번호 재설정 관련 안내입니다.",
        items: [
            "회원 가입 직후 발송되는 인증 메일을 반드시 확인해 주세요. 미인증 계정은 로그인할 수 없습니다.",
            "로그인 화면의 “비밀번호 초기화” 버튼을 눌러 등록된 이메일로 재설정 링크를 받을 수 있습니다.",
            "SNS 로그인에서 문제가 발생하면, 앱을 재실행한 뒤 동일한 계정으로 다시 시도하세요.",
        ],
    },
    {
        title: "학생 인증",
        description: "학생증 이미지와 학적 정보를 제출하여 커뮤니티 전체 기능을 이용할 수 있습니다.",
        items: [
            "마이 > 학생 인증하기에서 학번, 학과, 한글/영문 이름을 정확히 입력합니다.",
            "파일명은 자동으로 `student-ids/{korean}_{english}_{uid}` 포맷으로 저장되며 JPG/PNG를 권장합니다.",
            "심사에는 최대 1~2 영업일이 소요될 수 있으며, 진행 상황은 마이 화면의 배지로 확인 가능합니다.",
        ],
    },
    {
        title: "콘텐츠 & 검색",
        description: "뉴스, 커뮤니티, 공모전 데이터를 탐색하는 방법입니다.",
        items: [
            "홈 상단 검색창에서 2글자 이상 입력하면 Algolia 기반의 통합 검색 결과가 표시됩니다.",
            "검색 탭은 뉴스, 뉴스레터, 커뮤니티, 공모전 순으로 정렬되며 각 카드 선택 시 상세 화면으로 이동합니다.",
            "공모전/게시글은 개인 저장 기능을 제공하며, 저장 목록은 마이 > 저장한 공고에서 확인할 수 있습니다.",
        ],
    },
];

export default function HelpScreen() {
    const router = useRouter();

    return (
        <StyledSafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StyledView className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Button variant="ghost" size="icon" className="rounded-full" onPress={() => router.back()}>
                    <ArrowLeft size={22} color="#111827" />
                </Button>
                <StyledText className="text-base font-semibold text-gray-900">도움말</StyledText>
                <View style={{ width: 40 }} />
            </StyledView>

            <StyledScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 48 }}>
                {HELP_SECTIONS.map((section) => (
                    <StyledView key={section.title} className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <StyledText className="text-lg font-semibold text-gray-900 mb-1">{section.title}</StyledText>
                        <StyledText className="text-sm text-gray-500 mb-3">{section.description}</StyledText>
                        {section.items.map((item, idx) => (
                            <StyledView key={idx} className="flex-row items-start mb-2">
                                <StyledText className="text-xs font-semibold text-indigo-600 mr-2 mt-1">•</StyledText>
                                <StyledText className="flex-1 text-sm text-gray-700 leading-5">{item}</StyledText>
                            </StyledView>
                        ))}
                    </StyledView>
                ))}

                <StyledView className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 space-y-2">
                    <StyledText className="text-base font-semibold text-indigo-900">추가 도움이 필요하신가요?</StyledText>
                    <StyledText className="text-sm text-indigo-800">
                        서비스 이용 중 오류나 제안 사항이 있다면 아래 연락처로 알려주세요. 1 영업일 이내에 답변드릴게요.
                    </StyledText>
                    <StyledView className="flex-row items-center space-x-2">
                        <Mail size={16} color="#4338ca" />
                        <StyledText className="text-sm text-indigo-900">support@fine.news</StyledText>
                    </StyledView>
                    <StyledView className="flex-row items-center space-x-2">
                        <MessageCircle size={16} color="#4338ca" />
                        <StyledText className="text-sm text-indigo-900">카카오톡 채널 @fine-news</StyledText>
                    </StyledView>
                </StyledView>
            </StyledScrollView>
        </StyledSafeAreaView>
    );
}
