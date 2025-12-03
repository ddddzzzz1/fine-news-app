import React, { useMemo } from "react";
import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { styled } from "nativewind";
import { TrendingUp, Tag, Lightbulb, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledLinearGradient = styled(LinearGradient);

const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === "function") {
        return value.toDate();
    }
    if (value.seconds) {
        return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatKeyDataPoints = (raw) => {
    if (!raw) return null;
    if (typeof raw === "string") {
        return raw;
    }
    if (Array.isArray(raw)) {
        return raw
            .map((item) => {
                if (!item) return null;
                if (typeof item === "string") return item;
                if (typeof item === "object") {
                    const label = item.label || item.tag;
                    const value = item.value || item.text;
                    if (label && value) return `${label}: ${value}`;
                    return value || label || null;
                }
                return null;
            })
            .filter(Boolean)
            .join("\n");
    }
    if (typeof raw === "object") {
        if (Array.isArray(raw.highlights) && raw.highlights.length) {
            const highlight = raw.highlights[0];
            return highlight?.text || [highlight?.tag, highlight?.value].filter(Boolean).join(" ");
        }
        if (raw.hero) {
            const heroParts = [
                raw.hero.label,
                raw.hero.value ? `${raw.hero.value}${raw.hero.unit || ""}` : null,
                raw.hero.insight,
            ].filter(Boolean);
            if (heroParts.length) {
                return heroParts.join(" · ");
            }
        }
        if (Array.isArray(raw.details) && raw.details.length) {
            const detail = raw.details[0];
            const detailText = [detail?.label, detail?.value].filter(Boolean).join(": ");
            return detailText || detail?.note || null;
        }
        if (Array.isArray(raw.timeline) && raw.timeline.length) {
            const event = raw.timeline[0];
            return [event?.emoji, event?.step].filter(Boolean).join(" ");
        }
    }
    return null;
};

export default function NewsCard({ news }) {
    const displayDate = toDate(news.published_date) || toDate(news.created_date);
    const tags = Array.isArray(news.tags) ? news.tags.slice(0, 3) : [];
    const impactSummary = news.impact_analysis?.summary;
    const keyDataSummary = useMemo(() => formatKeyDataPoints(news?.key_data_points), [news?.key_data_points]);

    const insightText = impactSummary || keyDataSummary;
    const InsightIcon = impactSummary ? Lightbulb : TrendingUp;

    return (
        <Link href={`/news/${news.id}`} asChild>
            <Pressable>
                <StyledView className="mb-4 shadow-sm">
                    <StyledLinearGradient
                        colors={['#ffffff', '#f8fafc']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-2xl p-5 border border-slate-100"
                    >
                        {/* Header: State & Date */}
                        <StyledView className="flex-row items-center justify-between mb-3">
                            <StyledView className="flex-row items-center space-x-2">
                                {news.state === 'pending' && (
                                    <StyledView className="bg-amber-100 px-2 py-0.5 rounded-full mr-2 border border-amber-200">
                                        <StyledText className="text-[10px] font-bold text-amber-800">검토 중</StyledText>
                                    </StyledView>
                                )}
                                <StyledText className="text-xs text-slate-400 font-medium">
                                    {displayDate ? format(displayDate, "M월 d일 HH:mm", { locale: ko }) : "날짜 미정"}
                                </StyledText>
                            </StyledView>
                        </StyledView>

                        {/* Title */}
                        <StyledText className="font-bold text-[19px] text-slate-900 mb-2 leading-tight tracking-tight" numberOfLines={2}>
                            {news.title}
                        </StyledText>

                        {/* Summary (Optional) */}
                        {news.summary && (
                            <StyledText className="text-[13px] text-slate-500 mb-4 leading-5" numberOfLines={2}>
                                {news.summary}
                            </StyledText>
                        )}

                        {/* Key Data Points or Impact Analysis */}
                        {insightText && (
                            <StyledLinearGradient
                                colors={['#eff6ff', '#e0e7ff']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="rounded-xl p-3.5 mb-4 flex-row items-start border border-indigo-100/50"
                            >
                                <StyledView className="bg-white p-1 rounded-full mr-2.5 shadow-sm">
                                    <InsightIcon size={14} color="#4f46e5" />
                                </StyledView>
                                <StyledText className="text-[13px] text-indigo-900 font-medium flex-1 leading-5">
                                    {insightText}
                                </StyledText>
                            </StyledLinearGradient>
                        )}

                        {/* Footer: Tags & Action */}
                        <StyledView className="flex-row items-center justify-between mt-1">
                            <StyledView className="flex-row flex-wrap gap-1.5 flex-1 mr-2">
                                {tags.map((tag, index) => (
                                    <StyledView key={index} className="bg-slate-100 px-2 py-1 rounded-md flex-row items-center border border-slate-200">
                                        <Tag size={9} color="#64748b" style={{ marginRight: 3 }} />
                                        <StyledText className="text-[11px] text-slate-600 font-medium">{tag}</StyledText>
                                    </StyledView>
                                ))}
                            </StyledView>

                            <StyledView className="bg-slate-50 p-1.5 rounded-full">
                                <ChevronRight size={16} color="#94a3b8" />
                            </StyledView>
                        </StyledView>
                    </StyledLinearGradient>
                </StyledView>
            </Pressable>
        </Link>
    );
}
