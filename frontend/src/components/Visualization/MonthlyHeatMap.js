import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {colorBlue} from "../../constant/Constant";

const MonthlyHeatMap = ({ attendanceData }) => {
    const svgRef = useRef();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    function generateFutureDates() {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const allDaysInMonth = [];
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of the month

        let dateIterator = new Date(monthStart);

        while (dateIterator <= monthEnd) {
            const dateKey = `${(dateIterator.getMonth() + 1).toString().padStart(2, '0')}/${dateIterator.getDate().toString().padStart(2, '0')}/${dateIterator.getFullYear()}`;
            allDaysInMonth.push(dateKey);
            dateIterator.setDate(dateIterator.getDate() + 1);
        }

        return allDaysInMonth;
    }

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        // Clear previous content
        svg.selectAll("*").remove();

        const margin = { top: 20, right: 20, bottom: 30, left: 50 };
        const width = 700 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const processedData = Object.entries(attendanceData).map(([date, attendanceList]) => {
            const [month, day, year] = date.split("/").map(Number);
            const parsedDate = new Date(year, month - 1, day);

            const dayOfWeek = parsedDate.getDay();

            const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
            const dayOfMonth = parsedDate.getDate();

            const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth) / 7);

            const attendanceCount = attendanceList.filter(entry => entry.attendance === true).length;

            return { dateKey: date, dayOfWeek, weekOfMonth, count: attendanceCount };
        });

        // Define scales for the heatmap
        const xScale = d3.scaleBand()
            .domain(daysOfWeek)
            .range([0, width])
            .padding(0.05);

        const yScale = d3.scaleBand()
            .domain(d3.range(1, 6))
            .range([0, height])
            .padding(0.05);

        const allDaysInMonth = generateFutureDates();
        const mergedData = allDaysInMonth.map((date) => {
            const entry = processedData.find((d) => d.dateKey === date);
            const [month, day, year] = date.split("/").map(Number);
            const parsedDate = new Date(year, month - 1, day);
            const dayOfWeek = parsedDate.getDay();
            const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
            const dayOfMonth = parsedDate.getDate();
            const weekOfMonth = Math.ceil((dayOfMonth + firstDayOfMonth) / 7);

            return {
                dateKey: date,
                attendanceCount: entry ? entry.count : 0,
                dayOfWeek,
                weekOfMonth,
            };
        });

        const counts = mergedData.map(d => d.attendanceCount);
        const minCount = d3.min(counts);
        const maxCount = d3.max(counts);

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const pastDateColorScale = d3.scaleLinear()
            .domain([minCount, maxCount])
            .range(["#dfc7b8", "#af754f"])
            .interpolate(d3.interpolateLab);

        const colorScale = (count, date) => {
            const dateToCompare = new Date(date);
            dateToCompare.setHours(0, 0, 0, 0);

            if (dateToCompare > currentDate) {
                // Grey for future dates
                return "#d3d3d3";
            } else {
                return pastDateColorScale(count);
            }
        };

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "3px")
            .style("font-size", "12px");

        svg.selectAll(".cell")
            .data(mergedData)
            .enter()
            .append("rect")
            .attr("class", "cell")
            .attr("x", (d) => xScale(daysOfWeek[d.dayOfWeek]))
            .attr("y", (d) => yScale(d.weekOfMonth))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", (d) => colorScale(d.attendanceCount, d.dateKey))
            .on("mouseenter", function (event, d) {
                d3.select(this).style("stroke", colorBlue).style("stroke-width", "2px");

                tooltip
                    .style("visibility", "visible")
                    .style("opacity", 1)
                    .html(`Date: ${d.dateKey}<br>Attendance: ${d.attendanceCount}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseleave", function () {
                d3.select(this).style("stroke", "#ccc").style("stroke-width", "1px");

                tooltip.style("visibility", "hidden").style("opacity", 0);
            });

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .call(d3.axisLeft(yScale).tickFormat((d) => `Week ${d}`))
            .attr("class", "y-axis")
            .style("font-size", "12px")
            .style("font-family", "Arial");
    }, [attendanceData]);

    return (
        <div>
            <h2>Heatmap of Attendance for the Current Month</h2>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default MonthlyHeatMap;
