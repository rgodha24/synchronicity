package com.rohangodha.synchronicity
import io.ktor.client.*
import io.ktor.client.call.body
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

object NetworkClient {
    val httpClient = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
            })
        }
    }

    suspend fun getPlaylists(token: String): List<Playlist> {
        val list: List<Playlist> = httpClient.get("http://10.0.2.2:3000/authed/playlist") {
            headers {
                append("Authorization", "Bearer $token")
                append("Hello", "Please Work")
            }
        }.body()

        println(list)

        return list
    }
}

@Serializable
data class Playlist(val name: String, val imgUrl: String)