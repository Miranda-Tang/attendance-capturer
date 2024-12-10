import React, {useEffect, useRef, useState} from "react";
import * as d3 from "d3";
import {colorDarkBlue, colorDarkRed} from "../../constant/Constant";

const Past10DaysLineGraph = ({ attendanceData, profileCount }) => {
    const svgRef = useRef();
    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous content

        const margin = { top: 20, right: 100, bottom: 50, left: 70 };
        const width = 700 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;
        const successCheckInColor = colorDarkBlue;
        const notAttendColor = colorDarkRed;

        const chartGroup = svg
            .attr("width", width + margin.left + margin.right )
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Process Data
        const parseDate = d3.timeParse("%m/%d/%Y");
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 10);
        const allDates = d3.timeDays(tenDaysAgo, today).map((d) => d3.timeFormat("%m/%d/%Y")(d));

        // Process Data and fill missing dates with 0 attendance
        const processedData = allDates.map((date) => {
            const attendanceList = attendanceData[date] || [];
            const successCheckInCount = attendanceList.filter((entry) => entry.attendance === true).length;
            const notAttendedCount = profileCount - successCheckInCount;
            return { date, successCheckIn: successCheckInCount, notAttended: notAttendedCount };
        });

        // Convert string date to actual Date object
        const formattedData = processedData.map((d) => ({
            ...d,
            date: parseDate(d.date),
        }));

        // Define Scales
        const xScale = d3
            .scaleTime()
            .domain([tenDaysAgo, today])
            .range([0, width]);

        const maxAttendance = d3.max(formattedData, (d) => Math.max(d.successCheckIn, d.notAttended));

        let yAxisInterval;
        if (maxAttendance < 10) {
            yAxisInterval = 1;
        } else if (maxAttendance >= 10 && maxAttendance < 20) {
            yAxisInterval = 2;
        } else {
            yAxisInterval = 10;
        }

        const yScale = d3
            .scaleLinear()
            .domain([0, maxAttendance])
            .range([height, 0])

        // Define Line Generators
        const lineCheckInSuccess = d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.successCheckIn));

        const lineNotAttended = d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yScale(d.notAttended));

        // Add the lines
        const lineSuccessCheckInPath = chartGroup
            .append("path")
            .data([formattedData])
            .attr("class", "line-success-check-in")
            .attr("d", lineCheckInSuccess)
            .style("stroke", successCheckInColor)
            .style("fill", "none")
            .style("stroke-width", 2);

        const lineNotAttendedPath = chartGroup
            .append("path")
            .data([formattedData])
            .attr("class", "line-not-attended")
            .attr("d", lineNotAttended)
            .style("stroke", notAttendColor)
            .style("fill", "none")
            .style("stroke-width", 2);

        lineSuccessCheckInPath
            .attr("stroke-dasharray", function () {
                const length = this.getTotalLength();
                return length;
            })
            .attr("stroke-dashoffset", function () {
                return this.getTotalLength();
            })
            .transition()
            .duration(2000)
            .attr("stroke-dashoffset", 0);

        lineNotAttendedPath
            .attr("stroke-dasharray", function () {
                const length = this.getTotalLength();
                return length;
            })
            .attr("stroke-dashoffset", function () {
                return this.getTotalLength();
            })
            .transition()
            .duration(2000)
            .attr("stroke-dashoffset", 0);


        // Add Axes
        chartGroup
            .append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m.%d")))
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-family", "Arial");

        chartGroup
            .append("g")
            .call(d3.axisLeft(yScale).ticks(Math.ceil(maxAttendance / yAxisInterval)))
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-family", "Arial");

        // Add Axis Labels
        chartGroup
            .append("text")
            .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Date");

        chartGroup
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 10)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Number of Individuals");

        // Add Legend
        const legendGroup = svg.append("g").attr("transform", `translate(${margin.left + 20}, ${margin.top})`);

        legendGroup
            .append("rect")
            .attr("x", width - 50)
            .attr("y", 0)
            .attr("width", 100)
            .attr("height", 60)
            .attr("fill", "white")
            .attr("stroke", "black");

        const colorCollector = [successCheckInColor,  notAttendColor];
        const displayTextCollector = ["Attended",  "Not Attended"];

        for (let i = 0; i < 2; i++) {
            const yPosition = 15 + i * 20; // Adjust y position for each item

            // Add circle
            legendGroup
                .append("circle")
                .attr("cx", width - 40)
                .attr("cy", yPosition)
                .attr("r", 5)
                .style("fill", colorCollector[i]);

            // Add corresponding text
            legendGroup
                .append("text")
                .attr("x", width - 30)
                .attr("y", yPosition + 5)
                .style("font-size", "12px")
                .text(displayTextCollector[i]);
        }
    }, [attendanceData, profileCount, isFirstRender]);

    return (
    <div>
        <h2> Daily Attendance Trends Over the Past 10 Days</h2>
        <svg ref={svgRef}></svg>
    </div>
    )
};

export default Past10DaysLineGraph;
