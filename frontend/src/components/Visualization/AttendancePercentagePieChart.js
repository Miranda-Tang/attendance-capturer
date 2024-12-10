import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import {colorBlue, colorGrey, colorTheme, colorYellow} from "../../constant/Constant";

const AttendancePercentagePieChart = ({ attendanceData }) => {
    const svgRef = useRef();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 700;
        const height = 400;
        const radius = Math.min(width, height) / 2;

        const chartGroup = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 3}, ${height / 2})`);

        // Calculate attendance percentages
        const daysInMonth = 30;
        const attendees = {};

        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Add tooltip
        const tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid #ccc")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("font-size", "12px")
            .style("visibility", "hidden")
            .style("pointer-events", "none");

        Object.values(attendanceData).forEach((attendanceList) => {
            attendanceList.forEach((entry) => {
                if (!attendees[entry.profile_name]) {
                    attendees[entry.profile_name] = 0;
                }
                if (entry.attendance === true) {
                    attendees[entry.profile_name]++;
                }
            });
        });

        const categories = {
            "90-100%": 0,
            "70-90%": 0,
            "50-70%": 0,
            "<50%": 0,
        };

        Object.values(attendees).forEach((daysAttended) => {
            const attendancePercentage = (daysAttended / daysInMonth) * 100;
            if (attendancePercentage >= 90) {
                categories["90-100%"]++;
            } else if (attendancePercentage >= 70) {
                categories["70-90%"]++;
            } else if (attendancePercentage >= 50) {
                categories["50-70%"]++;
            } else {
                categories["<50%"]++;
            }
        });

        const pieData = Object.entries(categories).map(([label, value]) => ({
            label,
            value,
        }));

        const pie = d3.pie().value((d) => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);

        const color = d3
            .scaleOrdinal()
            .domain(pieData.map((d) => d.label))
            .range([colorTheme, colorBlue, colorYellow, colorGrey]);

        chartGroup
            .selectAll("path")
            .data(pie(pieData))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", (d) => color(d.data.label))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .on("mouseover", (event, d) => {
            tooltip
                .style("visibility", "visible")
                .text(`${d.data.label}: ${d.data.value}`);
        })
            .on("mousemove", (event) => {
                tooltip
                    .style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        // Add legend
        const legendGroup = svg
            .append("g")
            .attr("transform", `translate(${width - 200}, ${height / 2 - 100})`);

        legendGroup
            .append("text")
            .attr("x", 20)
            .attr("y", 0)
            .style("font-size", "12px")
            .style("font-family", "Arial")
            .text("Attendance Rate");

        pieData.forEach((d, i) => {
            legendGroup
                .append("rect")
                .attr("x", 0)
                .attr("y", i * 20 + 5)
                .attr("width", 15)
                .attr("height", 15)
                .style("fill", color(d.label));

            legendGroup
                .append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 15)
                .style("font-size", "12px")
                .style("font-family", "Arial")
                .text(d.label);
        });

    }, [attendanceData]);

    return (
        <div>
            <h2> Attendance Rate Distribution Over the Last 30 Days</h2>
            <svg ref={svgRef}></svg>
        </div>
        )
}

export default AttendancePercentagePieChart;
